
import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';

// The service account is now imported from a file that safely reads environment variables.
import { serviceAccount } from './service-account';

const ADMIN_APP_NAME = 'firebase-admin-app-transconnect';

export function getAdminApp(): { app: App | null; error: string | null } {
  // Check if the required service account details are present.
  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    const missingVars = [
      !serviceAccount.projectId && 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      !serviceAccount.clientEmail && 'FIREBASE_CLIENT_EMAIL',
      !serviceAccount.privateKey && 'FIREBASE_PRIVATE_KEY',
    ].filter(Boolean).join(', ');
    
    const errorMessage = `Firebase Admin SDK initialization failed: Missing environment variables: ${missingVars}.`;
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
