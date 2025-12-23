
'use server';

import { getApps, initializeApp, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp,FieldValue } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';

// Helper function to initialize Firebase Admin SDK idempotently.
function initializeAdminApp() {
  if (getApps().length === 0) {
    initializeApp({
      credential: credential.applicationDefault(),
    });
  }
  return getApp();
}

export async function deleteUser(uid: string): Promise<{ success: boolean; error?: string }> {
  try {
    const adminApp = initializeAdminApp();
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

export async function createManualTransaction(
    memberId: string, 
    adminUid: string,
    transactionData: {
        date: Date;
        type: 'credit' | 'debit';
        amount: number;
        description: string;
        transactionId: string;
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);
        const batch = firestore.batch();

        const transactionAmount = transactionData.type === 'credit' ? transactionData.amount : -transactionData.amount;
        
        // 1. Update member's wallet balance using FieldValue.increment
        const memberRef = firestore.collection('members').doc(memberId);
        batch.update(memberRef, { walletBalance: FieldValue.increment(transactionAmount) });
        
        // 2. Create a new transaction document
        const newTransactionRef = firestore.collection('transactions').doc();
        batch.set(newTransactionRef, {
            memberId: memberId,
            type: transactionData.type,
            amount: transactionData.amount,
            date: Timestamp.fromDate(new Date(transactionData.date)),
            description: transactionData.description,
            status: 'allocated',
            chartOfAccountsCode: '7000-ManualAdjustment',
            isAdjustment: true,
            postedBy: adminUid,
            transactionId: transactionData.transactionId,
            createdAt: FieldValue.serverTimestamp()
        });

        await batch.commit();
        
        return { success: true };
    } catch (error: any) {
        console.error('Failed to create manual transaction:', error);
        return { success: false, error: error.message || 'An unknown server error occurred.' };
    }
}


// NOTE: This server action is no longer used for reconciliation posting.
// The logic has been moved to the client-side `TransactionAllocation` component,
// protected by new Firestore security rules.
// This function is kept for potential future administrative tasks but is not currently active for posting.
export async function saveAndPostReconciliation(allocatedTransactions: any[], reconciliationId: string): Promise<{ success: boolean; error?: string }> {
    console.warn("`saveAndPostReconciliation` server action was called, but is deprecated. Wallet updates are now handled on the client.");
    return { success: false, error: "This function is deprecated. Please update the client to handle posting." };
}

