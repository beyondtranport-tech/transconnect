
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import type { ServiceAccount } from 'firebase-admin/app';

// Correctly import the service account JSON
import serviceAccount from './service-account.json';

const ADMIN_APP_NAME = 'firebase-admin-app-transconnect-studio';

export function getAdminApp(): { app: App | null; error: string | null } {
  // Check if the required service account details are present.
  if (!serviceAccount || !serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
    const errorMessage = `Firebase Admin SDK initialization failed: Service account details are missing or incomplete.`;
    console.error(errorMessage);
    return { app: null, error: errorMessage };
  }

  const existingApp = getApps().find(app => app.name === ADMIN_APP_NAME);
  if (existingApp) {
    return { app: existingApp, error: null };
  }

  try {
    const app = initializeApp({
      credential: cert(serviceAccount as ServiceAccount),
    }, ADMIN_APP_NAME);
    return { app, error: null };
  } catch (error: any) {
    const errorMessage = `Firebase Admin SDK initialization failed: ${error.message}`;
    console.error(errorMessage, error);
    return { app: null, error: errorMessage };
  }
}
