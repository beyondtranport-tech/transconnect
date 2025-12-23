
'use server';

import { getApps, initializeApp, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';

// Helper function to initialize Firebase Admin SDK idempotently.
function initializeAdminApp() {
  if (getApps().length === 0) {
    // This explicitly uses the Application Default Credentials from the hosting environment.
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

export async function saveAndPostReconciliation(allocatedTransactions: any[], reconciliationId: string): Promise<{ success: boolean; error?: string }> {
    // Initialize the admin app directly inside the server action for robustness.
    if (getApps().length === 0) {
        initializeApp({
            credential: credential.applicationDefault()
        });
    }
    const firestore = getFirestore();
    const batch = firestore.batch();

    try {
        for (const tx of allocatedTransactions) {
            // Only process credits with a valid member ID in the reference for now
            if (tx.type === 'credit' && tx.reference.length > 10) { // Simple check for UID-like reference
                const memberId = tx.reference;
                const memberRef = firestore.collection('members').doc(memberId);
                
                // Use FieldValue to increment the member's wallet balance
                batch.update(memberRef, {
                    walletBalance: FieldValue.increment(tx.amount)
                });
            }

            // Create a record in the main 'transactions' collection for audit purposes
            const transactionRef = firestore.collection('transactions').doc(); // Auto-generate ID
            batch.set(transactionRef, {
                reconciliationId: reconciliationId,
                memberId: tx.reference,
                type: tx.type,
                amount: tx.amount,
                date: new Date(tx.date),
                description: tx.description,
                status: 'allocated',
                chartOfAccountsCode: '4410', // Defaulting for now
                isAdjustment: false
            });
        }
        
        await batch.commit();

        return { success: true };

    } catch (error: any) {
        console.error('Failed to save and post reconciliation:', error);
        return { success: false, error: error.message || 'An unknown server error occurred during posting.' };
    }
}
