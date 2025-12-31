
import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
// The service account is imported from a JSON file.
// Ensure your service-account.json is in the `src/lib` directory.
import serviceAccount from './service-account.json';

// A constant to name our admin app instance.
const ADMIN_APP_NAME = 'firebase-admin-app-transconnect';

/**
 * Initializes and returns the Firebase Admin App instance.
 * It ensures that the app is initialized only once (singleton pattern).
 *
 * @returns {{ app: App | null; error: string | null }} An object containing the app instance or an error message.
 */
export function getAdminApp(): { app: App | null; error: string | null } {
  // Check if the app is already initialized.
  const existingApp = getApps().find(app => app.name === ADMIN_APP_NAME);
  if (existingApp) {
    return { app: existingApp, error: null };
  }

  // If not initialized, create a new instance.
  try {
    // We must cast the imported JSON to the ServiceAccount type.
    const validServiceAccount = serviceAccount as ServiceAccount;

    const app = initializeApp({
      credential: cert(validService-account),
    }, ADMIN_APP_NAME);

    return { app, error: null };
  } catch (error: any) {
    // Catch and return any initialization errors.
    return { app: null, error: `Firebase Admin SDK initialization failed: ${error.message}` };
  }
}
