
'use server';

import { getApps, initializeApp, getApp, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp, FieldValue, increment } from 'firebase-admin/firestore';

let adminApp: App;

// This async block ensures that Firebase Admin is initialized only once
// using a modern, bundler-friendly dynamic import for credentials.
if (!getApps().some(app => app.name === 'firebase-admin-app-transconnect-backend')) {
  try {
    // IMPORTANT: The service-account.json must be present in the project root.
    const serviceAccount = await import('../../../service-account.json');
    adminApp = initializeApp({
        credential: cert(serviceAccount)
    }, 'firebase-admin-app-transconnect-backend');
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND') {
        console.error(
          'FATAL: service-account.json not found in the project root.\n' +
          'Please download your service account key from the Firebase console and place it in the root of your project as `service-account.json`.\n'
        );
    } else {
        console.error('Firebase Admin SDK initialization failed:', error);
    }
    // In case of any error during initialization, we throw to prevent the app from running with a misconfigured backend.
    throw new Error('Server configuration error: Could not initialize Firebase Admin SDK.');
  }
} else {
    adminApp = getApp('firebase-admin-app-transconnect-backend');
}


export async function deleteUser(uid: string): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = getAuth(adminApp);
    const firestore = getFirestore(adminApp);

    // Step 1: Delete the user from Firebase Authentication.
    await auth.deleteUser(uid);
    
    // Step 2: Delete the user's document from the 'members' collection in Firestore.
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
        const firestore = getFirestore(adminApp);
        const transactionsSnap = await firestore.collection('transactions').where('memberId', '==', memberId).orderBy('date', 'desc').get();
        
        if (transactionsSnap.empty) {
            return { success: true, data: [] };
        }
        
        const transactions = transactionsSnap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Convert Firestore Timestamps to ISO strings for serialization
                date: (data.date as Timestamp).toDate().toISOString(),
                postedAt: data.postedAt ? (data.postedAt as Timestamp).toDate().toISOString() : null,
            };
        });
        
        return { success: true, data: transactions };

    } catch (error: any) {
        console.error('Failed to get transactions:', error);
        return { success: false, error: error.message || 'An unknown server error occurred.' };
    }
}


export async function createManualTransaction(
    memberId: string, 
    adminUserId: string,
    transactionData: { amount: number; description: string; date: Date; type: 'credit' | 'debit' }
): Promise<{ success: boolean; error?: string }> {
    try {
        const firestore = getFirestore(adminApp);
        
        const batch = firestore.batch();
        
        const memberRef = firestore.collection('members').doc(memberId);
        const transactionRef = firestore.collection('transactions').doc();
        
        const transactionAmount = transactionData.type === 'credit' ? transactionData.amount : -transactionData.amount;
        
        // 1. Update member's wallet balance
        batch.update(memberRef, { walletBalance: increment(transactionAmount) });
        
        // 2. Create the new transaction record
        const newTransaction = {
            reconciliationId: 'manual-admin-entry',
            memberId: memberId,
            type: transactionData.type,
            amount: transactionData.amount,
            date: Timestamp.fromDate(new Date(transactionData.date)),
            description: transactionData.description,
            status: 'allocated',
            chartOfAccountsCode: '7000-ManualAdjustment',
            isAdjustment: true,
            postedAt: FieldValue.serverTimestamp(),
            postedBy: adminUserId,
            transactionId: transactionRef.id // Use the auto-generated doc ID
        };
        batch.set(transactionRef, newTransaction);
        
        await batch.commit();
        
        return { success: true };
    } catch (error: any) {
        console.error('Failed to create manual transaction:', error);
        return { success: false, error: error.message || 'An unknown server error occurred.' };
    }
}
