'use server';

import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Helper function to initialize Firebase Admin SDK
function initializeAdminApp() {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }
  
  // This will use the GOOGLE_APPLICATION_CREDENTIALS environment variable
  // or Application Default Credentials from the hosting environment.
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
    
    // Delete from Firestore (this is redundant if client also does it, but good for atomicity)
    const memberDocRef = firestore.collection('members').doc(uid);
    await memberDocRef.delete();

    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    return { success: false, error: error.message || 'An unknown server error occurred.' };
  }
}
