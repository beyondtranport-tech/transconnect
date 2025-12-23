
'use server';

import { getApps, initializeApp, getApp, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp, FieldValue, increment } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

let adminApp: App | null = null;
let adminAppError: Error | null = null;

try {
  if (!getApps().some(app => app.name === 'firebase-admin-app-transconnect-backend')) {
    const serviceAccountPath = path.resolve(process.cwd(), 'service-account.json');
    
    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        adminApp = initializeApp({
            credential: cert(serviceAccount)
        }, 'firebase-admin-app-transconnect-backend');
    } else {
        throw new Error('Firebase service-account.json not found in the project root. Backend administrative actions will fail. Please add your service account credentials to enable this functionality.');
    }
  } else {
    adminApp = getApp('firebase-admin-app-transconnect-backend');
  }
} catch (error: any) {
    console.error("Failed to initialize Firebase Admin SDK:", error.message);
    adminAppError = error;
}

function getSafeAdminApp() {
    if (adminAppError) throw adminAppError;
    if (!adminApp) throw new Error("Firebase Admin SDK is not initialized.");
    return adminApp;
}


export async function deleteUser(uid: string): Promise<{ success: boolean; error?: string }> {
  try {
    const app = getSafeAdminApp();
    const auth = getAuth(app);
    const firestore = getFirestore(app);

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
        const app = getSafeAdminApp();
        const firestore = getFirestore(app);
        const transactionsSnap = await firestore.collection('transactions').where('memberId', '==', memberId).orderBy('date', 'desc').get();
        
        if (transactionsSnap.empty) {
            return { success: true, data: [] };
        }
        
        const transactions = transactionsSnap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
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
        const app = getSafeAdminApp();
        const firestore = getFirestore(app);
        const batch = firestore.batch();
        
        const memberRef = firestore.collection('members').doc(memberId);
        const transactionRef = firestore.collection('transactions').doc();
        
        const transactionAmount = transactionData.type === 'credit' ? transactionData.amount : -transactionData.amount;
        
        batch.update(memberRef, { walletBalance: increment(transactionAmount) });
        
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
            transactionId: transactionRef.id
        };
        batch.set(transactionRef, newTransaction);
        
        await batch.commit();
        
        return { success: true };
    } catch (error: any) {
        console.error('Failed to create manual transaction:', error);
        return { success: false, error: error.message || 'An unknown server error occurred.' };
    }
}
