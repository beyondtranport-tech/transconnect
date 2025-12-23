
'use server';

import { getApps, initializeApp, getApp, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// This file is being simplified to remove the failing transaction logic.
// The createManualTransaction and getTransactionsForMember functions have been removed
// as they were causing server authentication errors.
// The logic has been moved to a client-side batch write in member-wallet.tsx with appropriate security rules.

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
