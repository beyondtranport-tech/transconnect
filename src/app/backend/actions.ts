
'use server';

import { getApps, initializeApp, cert, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Helper function to initialize Firebase Admin SDK idempotently.
function initializeAdminApp() {
  // Check if the default app is already initialized.
  if (getApps().some(app => app.name === '[DEFAULT]')) {
    return getApp();
  }
  
  // This will use the GOOGLE_APPLICATION_CREDENTIALS environment variable
  // or Application Default Credentials from the hosting environment.
  // It is critical to call initializeApp() without arguments in this environment.
  return initializeApp();
}

export async function deleteUser(uid: string): Promise<{ success: boolean; error?: string }> {
  try {
    const adminApp = initializeAdminApp();
    const auth = getAuth(adminApp);
    const firestore = getFirestore(adminApp);

    // Step 1: Delete the user from Firebase Authentication.
    // This is the privileged operation that requires the Admin SDK.
    await auth.deleteUser(uid);
    
    // Step 2: Delete the user's document from the 'members' collection in Firestore.
    const memberDocRef = firestore.collection('members').doc(uid);
    await memberDocRef.delete();

    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    // Return a more generic error to the client, but log the specific one on the server.
    return { success: false, error: error.message || 'An unknown server error occurred during user deletion.' };
  }
}

export async function saveAndPostReconciliation(allocatedTransactions: any[], reconciliationId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);
        const batch = firestore.batch();

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

    