
'use server';

import { getApps, initializeApp, getApp, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';

// Helper function to initialize Firebase Admin SDK idempotently.
function initializeAdminApp(): App {
    const appName = 'firebase-admin-app-transconnect-backend';
    // Check if the app is already initialized
    const existingApp = getApps().find(app => app.name === appName);
    if (existingApp) {
        return existingApp;
    }

    try {
        // IMPORTANT: The service-account.json must be present in the root directory.
        const serviceAccount = require('../../../service-account.json');
         return initializeApp({
            credential: cert(serviceAccount)
        }, appName);
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
