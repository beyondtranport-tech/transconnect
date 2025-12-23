
'use server';

import { getApps, initializeApp, getApp, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp,FieldValue } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';

// Helper function to initialize Firebase Admin SDK idempotently.
function initializeAdminApp(): App {
    const appName = 'firebase-admin-app-transconnect';
    const existingApp = getApps().find(app => app.name === appName);
    if (existingApp) {
        return existingApp;
    }
    
    try {
        // This is the recommended way to initialize in a serverless environment
        // It will use the service account credentials from the environment variables
        return initializeApp({
             credential: credential.applicationDefault(),
        }, appName);
    } catch (error: any) {
        if (process.env.NODE_ENV !== 'production') {
            // For local development, you might use a service account file
            // Make sure the path is correct and the file is not in a public folder
            try {
                const serviceAccount = require('../../../service-account.json');
                 return initializeApp({
                    credential: credential.cert(serviceAccount)
                }, appName);
            } catch (e) {
                 console.error("Local service account not found or failed to initialize. Make sure 'service-account.json' is in the root and configured correctly.", e);
            }
        }
        console.error("Failed to initialize Firebase Admin SDK. Make sure Application Default Credentials are configured for your environment.", error);
        throw new Error("Server configuration error. Could not connect to Firebase services.");
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
