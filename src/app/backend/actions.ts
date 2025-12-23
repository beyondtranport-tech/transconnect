'use server';

import { getApps, initializeApp, getApp, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { DocumentData } from 'firebase/firestore';

let adminApp: App;
if (!getApps().length) {
    try {
        const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
        if (serviceAccountString) {
            const serviceAccount = JSON.parse(Buffer.from(serviceAccountString, 'base64').toString('utf-8'));
            adminApp = initializeApp({
                credential: cert(serviceAccount)
            });
        } else {
             // In environments without the variable, some actions might fail.
             // This is now handled gracefully in the actions themselves.
        }
    } catch (e) {
        console.error("Firebase Admin SDK initialization failed:", e);
    }
} else {
  adminApp = getApp();
}

function getSafeFirestore() {
    if (!adminApp) {
        throw new Error("Firebase Admin SDK is not initialized. Ensure FIREBASE_SERVICE_ACCOUNT_BASE64 is set in your environment for admin actions to work.");
    }
    return getFirestore(adminApp);
}

function getSafeAuth() {
    if (!adminApp) {
         throw new Error("Firebase Admin SDK is not initialized. Ensure FIREBASE_SERVICE_ACCOUNT_BASE64 is set in your environment for admin actions to work.");
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

export async function getTransactionsForMember(memberId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const firestore = getSafeFirestore();
    const transactionsSnapshot = await firestore.collection('transactions').where('memberId', '==', memberId).get();
    const transactions = transactionsSnapshot.docs.map(doc => {
        const data = doc.data();
        // Manually convert Timestamp to a serializable format (ISO string)
        return {
            ...data,
            id: doc.id,
            date: data.date.toDate().toISOString(),
            postedAt: data.postedAt?.toDate().toISOString(),
        };
    });
    return { success: true, data: transactions };
  } catch (error: any) {
    console.error('Failed to get transactions:', error);
    return { success: false, error: error.message || 'An unknown server error occurred during transaction fetch.' };
  }
}

export async function createManualTransaction(memberId: string, values: { amount: number; description: string; date: Date; type: 'credit' | 'debit'; }, adminUserId: string): Promise<{ success: boolean; error?: string; data?: any; }> {
    try {
        const firestore = getSafeFirestore();
        const batch = firestore.batch();

        const memberRef = firestore.collection('members').doc(memberId);
        const transactionAmount = values.type === 'credit' ? values.amount : -values.amount;
        batch.update(memberRef, { walletBalance: FieldValue.increment(transactionAmount) });

        const transactionRef = firestore.collection('transactions').doc();
        const newTransaction = {
            id: transactionRef.id,
            memberId: memberId,
            reconciliationId: 'manual-admin-entry',
            type: values.type,
            amount: values.amount,
            date: values.date,
            description: values.description,
            status: 'allocated',
            chartOfAccountsCode: '7000-ManualAdjustment',
            isAdjustment: true,
            postedAt: FieldValue.serverTimestamp(),
            postedBy: adminUserId,
            transactionId: transactionRef.id
        };
        batch.set(transactionRef, newTransaction);
        
        await batch.commit();

        return { success: true, data: { ...newTransaction, date: newTransaction.date.toISOString(), postedAt: new Date().toISOString() } };

    } catch (error: any) {
        console.error('Failed to create manual transaction:', error);
        return { success: false, error: error.message || 'An unknown server error occurred.' };
    }
}