
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { serviceAccount } from './service-account-credentials';

const ADMIN_APP_NAME = 'firebase-admin-app-transconnect';

export function getAdminApp(): { app: App | null; error: string | null } {
  const existingApp = getApps().find(app => app.name === ADMIN_APP_NAME);
  if (existingApp) {
    return { app: existingApp, error: null };
  }

  try {
    const app = initializeApp({
      credential: cert(serviceAccount),
    }, ADMIN_APP_NAME);
    return { app, error: null };
  } catch (error: any) {
    return { app: null, error: `Firebase Admin SDK initialization failed: ${error.message}` };
  }
}
