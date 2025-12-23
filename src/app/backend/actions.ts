
'use server';

import { getApps, initializeApp, getApp, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

let adminApp: App;
if (!getApps().length) {
    try {
        const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
        if (!serviceAccountString) {
            throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 env var is not set.");
        }
        const serviceAccount = JSON.parse(Buffer.from(serviceAccountString, 'base64').toString('utf-8'));
        adminApp = initializeApp({
            credential: cert(serviceAccount)
        });
    } catch (e) {
        console.error("Firebase Admin SDK initialization failed", e);
        // We will proceed, and subsequent calls will fail with a clearer error
    }
} else {
  adminApp = getApp();
}

function getSafeFirestore() {
    if (!adminApp) {
        throw new Error("Firebase Admin SDK is not initialized. Check server logs for details.");
    }
    return getFirestore(adminApp);
}

function getSafeAuth() {
    if (!adminApp) {
        throw new Error("Firebase Admin SDK is not initialized. Check server logs for details.");
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
        const transactionsSnap = await firestore.collection('transactions').where('memberId', '==', memberId).orderBy('date', 'desc').get();
        
        if (transactionsSnap.empty) {
            return { success: true, data: [] };
        }
        
        const transactions = transactionsSnap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: (data.date instanceof Timestamp) ? data.date.toDate().toISOString() : data.date,
                postedAt: data.postedAt ? (data.postedAt as Timestamp).toDate().toISOString() : null,
            };
        });
        
        return { success: true, data: transactions };

    } catch (error: any) {
        console.error('Failed to get transactions:', error);
        return { success: false, error: error.message || 'An unknown server error occurred.' };
    }
}

export async function createManualTransaction(memberId: string, transaction: { amount: number, description: string, date: Date, type: 'credit' | 'debit' }, adminUid: string): Promise<{ success: boolean, error?: string }> {
    try {
        const firestore = getSafeFirestore();
        const batch = firestore.batch();

        const memberRef = firestore.collection('members').doc(memberId);
        const transactionAmount = transaction.type === 'credit' ? transaction.amount : -transaction.amount;
        batch.update(memberRef, { walletBalance: admin.firestore.FieldValue.increment(transactionAmount) });

        const transactionRef = firestore.collection('transactions').doc();
        batch.set(transactionRef, {
            reconciliationId: 'manual-admin-entry',
            memberId: memberId,
            type: transaction.type,
            amount: transaction.amount,
            date: Timestamp.fromDate(transaction.date),
            description: transaction.description,
            status: 'allocated',
            chartOfAccountsCode: '7000-ManualAdjustment',
            isAdjustment: true,
            postedAt: Timestamp.now(),
            postedBy: adminUid,
            transactionId: transactionRef.id
        });

        await batch.commit();
        return { success: true };

    } catch (error: any) {
        console.error('Failed to create manual transaction:', error);
        return { success: false, error: error.message || 'An unknown server error occurred.' };
    }
}
    

    