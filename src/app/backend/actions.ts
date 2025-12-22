
'use server';

import { getApps, initializeApp, cert, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

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

    // Step 1: Delete the user's document from the 'members' collection in Firestore.
    // This is done first to ensure we have the data before deleting the auth user.
    const memberDocRef = firestore.collection('members').doc(uid);
    await memberDocRef.delete();
    
    // Step 2: Delete the user from Firebase Authentication.
    // This is the privileged operation that requires the Admin SDK.
    await auth.deleteUser(uid);

    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    // Return a more generic error to the client, but log the specific one on the server.
    return { success: false, error: error.message || 'An unknown server error occurred during user deletion.' };
  }
}
