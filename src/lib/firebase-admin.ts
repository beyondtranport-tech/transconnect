
import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';

// This function initializes and returns the Firebase Admin App instance,
// ensuring it's only created once.
export function getAdminApp(): { app: App | null; error: string | null } {
  // Check if the app is already initialized
  const existingApp = getApps().find(app => app.name === 'firebase-admin-app-transconnect');
  if (existingApp) {
    return { app: existingApp, error: null };
  }

  const adminSdkConfigB64 = process.env.FIREBASE_ADMIN_SDK_CONFIG_B64;

  if (!adminSdkConfigB64) {
    const error = "Admin SDK Error: The FIREBASE_ADMIN_SDK_CONFIG_B64 environment variable is not defined.";
    console.error(error);
    return { app: null, error };
  }

  try {
    // Decode the Base64 string to get the JSON string.
    const decodedConfig = Buffer.from(adminSdkConfigB64, 'base64').toString('utf-8');
    
    // Parse the JSON string into a ServiceAccount object.
    const serviceAccount: ServiceAccount = JSON.parse(decodedConfig);
    
    // Initialize the app with the complete service account object.
    const app = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    }, 'firebase-admin-app-transconnect'); // Give the app a unique name

    return { app, error: null };

  } catch (error: any) {
    console.error("Admin SDK Initialization Failed:", error.message);
    const detailedError = `Firebase Admin SDK initialization failed: ${error.message}. This can happen if the FIREBASE_ADMIN_SDK_CONFIG_B64 environment variable is not a valid Base64 encoded service account JSON. Use the provided encoder tool to generate a correct string.`;
    return { app: null, error: detailedError };
  }
}
