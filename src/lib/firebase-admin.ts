
import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';

// This function initializes and returns the Firebase Admin App instance,
// ensuring it's only created once.
export function getAdminApp(): { app: App | null; error: string | null } {
  const adminSdkConfigB64 = process.env.FIREBASE_ADMIN_SDK_CONFIG_B64;

  if (!adminSdkConfigB64) {
    const error = "Admin SDK Error: FIREBASE_ADMIN_SDK_CONFIG_B64 is not defined in the environment.";
    console.error(error);
    return { app: null, error };
  }

  // Check if the app is already initialized
  const existingApp = getApps().find(app => app.name === 'firebase-admin-app-transconnect');
  if (existingApp) {
    return { app: existingApp, error: null };
  }

  // If not initialized, create it
  try {
    const decodedConfig = Buffer.from(adminSdkConfigB64, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(decodedConfig) as ServiceAccount;

    // IMPORTANT: Replace literal "\\n" with actual newline characters in the private key
    if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    if (!serviceAccount.private_key) {
      const error = "Admin SDK Error: Parsed service account is missing 'private_key'. Check environment variable encoding.";
      console.error(error);
      return { app: null, error };
    }

    const app = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    }, 'firebase-admin-app-transconnect'); // Give the app a unique name

    return { app, error: null };

  } catch (error: any) {
    console.error("Admin SDK Initialization Failed:", error.message);
    return { app, null, error: `Firebase Admin SDK initialization failed: ${error.message}` };
  }
}
