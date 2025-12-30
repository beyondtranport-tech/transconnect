
import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';

// This function initializes and returns the Firebase Admin App instance,
// ensuring it's only created once.
export function getAdminApp(): { app: App | null; error: string | null } {
  const adminSdkConfigB64 = process.env.FIREBASE_ADMIN_SDK_CONFIG_B64;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!adminSdkConfigB64) {
    const error = "Admin SDK Error: The FIREBASE_ADMIN_SDK_CONFIG_B64 environment variable is not defined.";
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
    const serviceAccountJSON = JSON.parse(decodedConfig);

    const serviceAccount: ServiceAccount = {
        projectId: serviceAccountJSON.project_id,
        clientEmail: serviceAccountJSON.client_email,
        privateKey: (serviceAccountJSON.private_key || '').replace(/\\n/g, '\n'),
    };
    
    const app = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    }, 'firebase-admin-app-transconnect'); // Give the app a unique name

    return { app, error: null };

  } catch (error: any) {
    console.error("Admin SDK Initialization Failed:", error.message);
    const detailedError = `Firebase Admin SDK initialization failed: ${error.message}. Check if the service account details are correct.`;
    return { app: null, error: detailedError };
  }
}

// A new function to check the status without throwing an error in the component
export async function checkAdminSdk(): Promise<{ success: boolean; error?: string }> {
    const { app, error } = getAdminApp();
    if (error) {
        return { success: false, error };
    }
    if (!app) {
        return { success: false, error: 'Firebase Admin SDK could not be initialized.' };
    }
    // A simple check to see if we can interact with a service (e.g., auth)
    // This part is more complex, so for now, just checking initialization is enough.
    return { success: true };
}
