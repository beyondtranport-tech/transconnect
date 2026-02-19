
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import type { ServiceAccount } from 'firebase-admin/app';
import { NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Reverting to v7 initialization to fix potential hangs.
const ADMIN_APP_NAME = 'firebase-admin-app-transconnect-studio-v7';

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
        throw new Error('Parsed service account is invalid or missing essential properties (project_id, client_email, private_key). Please re-generate it following the backend-setup.md guide.');
    }
    
    const projectId = serviceAccount.project_id;
    const storageBucket = `${projectId}.appspot.com`;

    // The storageBucket property is REQUIRED for the Admin SDK to know which bucket to interact with.
    // My previous attempt to remove it was incorrect. This will resolve the "Bucket not specified" error.
    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: projectId,
      storageBucket: storageBucket,
    }, ADMIN_APP_NAME);

    return { app, error: null };

  } catch (error: any) {
    const errorMessage = `Firebase Admin SDK initialization failed: ${error.message}`;
    console.error(errorMessage, error);
    return { app: null, error: errorMessage };
  }
}

export async function verifyAdmin(req: NextRequest) {
    const { app, error: initError } = getAdminApp();
    if (initError || !app) {
        throw new Error(`Admin SDK not initialized: ${initError}`);
    }

    const authorization = req.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
        throw new Error('Unauthorized: Missing or invalid token.');
    }
    const token = authorization.split('Bearer ')[1];
    
    const adminAuth = getAuth(app);
    const decodedToken = await adminAuth.verifyIdToken(token);
    const isAdmin = decodedToken.email === 'mkoton100@gmail.com';

    if (!isAdmin) {
        throw new Error("Forbidden: Admin access required.");
    }
    
    return {
        db: getFirestore(app),
        adminUid: decodedToken.uid
    };
}
