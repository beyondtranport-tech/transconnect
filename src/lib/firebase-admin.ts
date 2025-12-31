
import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
import serviceAccount from '@/lib/service-account.json';

// This function initializes and returns the Firebase Admin App instance,
// ensuring it's only created once.
export function getAdminApp(): { app: App | null; error: string | null } {
  // Check if the app is already initialized
  const existingApp = getApps().find(app => app.name === 'firebase-admin-app-transconnect');
  if (existingApp) {
    return { app: existingApp, error: null };
  }

  try {
    // Ensure the imported service account has the necessary properties.
    // This is a type-safe way to check before passing to cert().
    const validServiceAccount = serviceAccount as ServiceAccount;
    if (!validServiceAccount.project_id || !validServiceAccount.private_key || !validServiceAccount.client_email) {
        throw new Error("The service-account.json file is missing required fields (project_id, private_key, client_email).");
    }

    const app = initializeApp({
      credential: cert(validServiceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    }, 'firebase-admin-app-transconnect'); // Give the app a unique name

    return { app, error: null };

  } catch (error: any) {
    console.error("Admin SDK Initialization Failed:", error.message);
    const detailedError = `Firebase Admin SDK initialization failed: ${error.message}. Please ensure the 'src/lib/service-account.json' file contains a valid service account key.`;
    return { app: null, error: detailedError };
  }
}
