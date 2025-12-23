
'use server';

import { getApps, initializeApp, getApp, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

let adminApp: App;
if (!getApps().length) {
    try {
        const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
        if (!serviceAccountString) {
            console.warn("FIREBASE_SERVICE_ACCOUNT_BASE64 not found. Server actions requiring admin privileges may fail.");
        } else {
            const serviceAccount = JSON.parse(Buffer.from(serviceAccountString, 'base64').toString('utf-8'));
            adminApp = initializeApp({
                credential: cert(serviceAccount)
            });
        }
    } catch (e) {
        console.error("Firebase Admin SDK initialization failed:", e);
    }
} else {
  adminApp = getApp();
}

function getSafeFirestore() {
    if (!adminApp) {
        throw new Error("Firebase Admin SDK is not initialized. Ensure FIREBASE_SERVICE_ACCOUNT_BASE64 is set in your environment.");
    }
    return getFirestore(adminApp);
}

function getSafeAuth() {
    if (!adminApp) {
         throw new Error("Firebase Admin SDK is not initialized. Ensure FIREBASE_SERVICE_ACCOUNT_BASE64 is set in your environment.");
    }
    return getAuth(adminApp);
}


export async function deleteUser(uid: string): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = getSafeAuth();
    const firestore = getSafeFirestore();

    await auth.deleteUser(uid);
    const memberDocRef = firestore.collection('members').doc(uid);
    await memberDocRef.delete();

    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    return { success: false, error: error.message || 'An unknown server error occurred during user deletion.' };
  }
}

export async function createManualTransaction(memberId: string, values: { amount: number; description: string; date: Date; type: 'credit' | 'debit'; }) {
    if (!adminApp) {
        return { success: false, error: "Server authentication is not configured." };
    }

    try {
        const firestore = getSafeFirestore();
        const batch = firestore.batch();
        const memberRef = firestore.collection('members').doc(memberId);
        const transactionRef = firestore.collection('transactions').doc(); // Auto-generate ID

        const transactionAmount = values.type === 'credit' ? values.amount : -values.amount;

        batch.update(memberRef, { walletBalance: FieldValue.increment(transactionAmount) });
        
        batch.set(transactionRef, {
            reconciliationId: 'manual-admin-entry',
            memberId: memberId,
            type: values.type,
            amount: values.amount,
            date: values.date,
            description: values.description,
            status: 'allocated',
            chartOfAccountsCode: '7000-ManualAdjustment',
            isAdjustment: true,
            postedAt: FieldValue.serverTimestamp(),
            // In a real app, you might want to log which admin did this
            // postedBy: adminUserId, 
            transactionId: transactionRef.id
        });

        await batch.commit();
        return { success: true };

    } catch (error: any) {
        console.error('Error creating manual transaction:', error);
        return { success: false, error: error.message || 'An unknown server error occurred.' };
    }
}

export async function getTransactionsForMember(memberId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    if (!adminApp) {
        return { success: false, error: "Server authentication is not configured." };
    }
    try {
        const firestore = getSafeFirestore();
        const snapshot = await firestore.collection('transactions').where('memberId', '==', memberId).get();
        const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { success: true, data: transactions };
    } catch (error: any) {
        console.error('Error fetching transactions:', error);
        return { success: false, error: error.message || 'An unknown server error occurred.' };
    }
}
