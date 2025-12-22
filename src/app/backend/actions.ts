'use server';

import { getApps, initializeApp, cert, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Helper function to initialize Firebase Admin SDK
function initializeAdminApp() {
  const apps = getApps();
  // Use the default app if it already exists.
  if (apps.length > 0) {
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
    if (!adminApp) throw new Error("Admin SDK initialization failed.");

    const auth = getAuth(adminApp);
    const firestore = getFirestore(adminApp);

    // Delete from Firebase Authentication
    await auth.deleteUser(uid);
    
    // Delete from Firestore
    const memberDocRef = firestore.collection('members').doc(uid);
    await memberDocRef.delete();

    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    // Return a more generic error to the client, but log the specific one on the server.
    return { success: false, error: 'An unknown server error occurred during user deletion.' };
  }
}
