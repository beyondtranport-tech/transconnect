
'use server';

import { getApps, initializeApp, getApp, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';

// Helper function to initialize Firebase Admin SDK idempotently.
function initializeAdminApp(): App {
    const appName = 'firebase-admin-app-transconnect-backend';
    const existingApp = getApps().find(app => app.name === appName);
    if (existingApp) {
        return existingApp;
    }
    
    // This will use the service account from environment variables in production (e.g., Google Cloud)
    // For local dev, it falls back to a service-account.json file.
    try {
        return initializeApp({
             credential: credential.applicationDefault(),
        }, appName);
    } catch (error: any) {
         if (process.env.NODE_ENV !== 'production') {
            try {
                const serviceAccount = require('../../../service-account.json');
                 return initializeApp({
                    credential: cert(serviceAccount)
                }, appName);
            } catch (e) {
                 console.error("Could not initialize Firebase Admin SDK with service-account.json. Make sure the file exists in your project root.", e);
                 throw new Error("Server configuration error: Local Firebase credentials failed.");
            }
        }
        console.error("Firebase Admin SDK initialization failed. Ensure Application Default Credentials are set.", error);
        throw new Error("Server configuration error: Could not connect to Firebase services.");
    }
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

interface TransactionData {
  memberId: string;
  amount: number;
  description: string;
  date: Date;
  type: 'credit' | 'debit';
  adminUserId: string;
}

export async function createManualTransaction(data: TransactionData): Promise<{ success: boolean; error?: string }> {
    try {
        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);

        const memberRef = firestore.collection('members').doc(data.memberId);
        const transactionRef = firestore.collection('transactions').doc(); // Auto-generate ID

        const transactionAmount = data.type === 'credit' ? data.amount : -data.amount;

        // Perform the writes in a single atomic batch
        const batch = firestore.batch();
        
        batch.update(memberRef, { walletBalance: FieldValue.increment(transactionAmount) });
        
        batch.set(transactionRef, {
            reconciliationId: 'manual-admin-entry',
            memberId: data.memberId,
            type: data.type,
            amount: data.amount,
            date: Timestamp.fromDate(new Date(data.date)),
            description: data.description,
            status: 'allocated',
            chartOfAccountsCode: '7000-ManualAdjustment',
            isAdjustment: true,
            postedAt: FieldValue.serverTimestamp(),
            postedBy: data.adminUserId,
            transactionId: `ADJ-${Date.now()}`
        });

        await batch.commit();
        
        return { success: true };

    } catch (error: any) {
        console.error('Failed to create manual transaction:', error);
        return { success: false, error: error.message || 'An unknown server error occurred.' };
    }
}

export async function getTransactionsForMember(memberId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);

        const transactionsSnap = await firestore.collection('transactions')
            .where('memberId', '==', memberId)
            .orderBy('date', 'desc')
            .get();
        
        if (transactionsSnap.empty) {
            return { success: true, data: [] };
        }

        const transactions = transactionsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Convert Firestore Timestamps to serializable strings
            date: (doc.data().date as Timestamp).toDate().toISOString(),
        }));

        return { success: true, data: transactions };

    } catch (error: any) {
        console.error('Failed to get transactions for member:', error);
        return { success: false, error: error.message || 'An unknown server error occurred.' };
    }
}
