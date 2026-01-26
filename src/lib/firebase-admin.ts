
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import type { ServiceAccount } from 'firebase-admin/app';

const ADMIN_APP_NAME = 'firebase-admin-app-transconnect-studio';

export function getAdminApp(): { app: App | null; error: string | null } {
  const existingApp = getApps().find(app => app.name === ADMIN_APP_NAME);
  if (existingApp) {
    return { app: existingApp, error: null };
  }

  const encodedServiceAccount = process.env.FIREBASE_ADMIN_SDK_CONFIG_B64;

  if (!encodedServiceAccount) {
    const errorMessage = 'Firebase Admin SDK initialization failed: The FIREBASE_ADMIN_SDK_CONFIG_B64 environment variable is not set.';
    console.error(errorMessage);
    return { app: null, error: errorMessage };
  }

  try {
    const serviceAccountJson = Buffer.from(encodedServiceAccount, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount;

    if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
        throw new Error('Parsed service account is missing essential properties (project_id, client_email, private_key).');
    }
    
    // Explicitly set the projectId and storageBucket to ensure correct initialization.
    const app = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: 'transconnect-v1-39578841-2a857.appspot.com',
      projectId: 'transconnect-v1-39578841-2a857',
    }, ADMIN_APP_NAME);

    return { app, error: null };

  } catch (error: any) {
    const errorMessage = `Firebase Admin SDK initialization failed: ${error.message}`;
    console.error(errorMessage, error);
    return { app: null, error: errorMessage };
  }
}
