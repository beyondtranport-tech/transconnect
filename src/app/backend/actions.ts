'use server';

import { getApps, initializeApp, getApp, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// This function initializes the Firebase Admin SDK.
// It's safe to call multiple times.
function initializeAdminApp() {
    if (getApps().some(app => app.name === 'admin')) {
        return getApp('admin');
    }

    // Check if the service account environment variable is set.
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (!serviceAccountString) {
        throw new Error("Firebase Admin SDK initialization failed: The FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set. This is required for server-side admin actions.");
    }
    
    try {
        const serviceAccount = JSON.parse(Buffer.from(serviceAccountString, 'base64').toString('utf-8'));
        return initializeApp({
            credential: cert(serviceAccount)
        }, 'admin');
    } catch (e: any) {
        console.error("Firebase Admin SDK initialization failed:", e);
        throw new Error(`Firebase Admin SDK could not be initialized. The error was: ${e.message}`);
    }
}

// Securely gets a member's data from the server.
export async function getMember(uid: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const adminApp = initializeAdminApp();
    const firestore = getFirestore(adminApp);

    const memberDocRef = firestore.collection('members').doc(uid);
    const memberDoc = await memberDocRef.get();

    if (!memberDoc.exists) {
      return { success: false, error: 'Member not found.' };
    }
    
    const data = memberDoc.data();
    
    // Firestore Timestamps need to be converted to be sent to the client
    const sanitizedData: any = {};
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            sanitizedData[key] = data[key].toDate().toISOString();
        } else {
            sanitizedData[key] = data[key];
        }
    }

    return { success: true, data: sanitizedData };
  } catch (error: any) {
    console.error('Failed to get member:', error);
    return { success: false, error: error.message || 'An unknown server error occurred.' };
  }
}

// Deletes a user and their corresponding member document.
export async function deleteUser(uid: string): Promise<{ success: boolean; error?: string }> {
  try {
    const adminApp = initializeAdminApp();
    const auth = getAuth(adminApp);
    const firestore = getFirestore(adminApp);

    await auth.deleteUser(uid);
    const memberDocRef = firestore.collection('members').doc(uid);
    await memberDocRef.delete();

    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    return { success: false, error: error.message || 'An unknown server error occurred during user deletion.' };
  }
}
