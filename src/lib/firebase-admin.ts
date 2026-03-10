
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import type { ServiceAccount } from 'firebase-admin/app';
import { NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Simplified and robust initialization logic.
let adminApp: App | null = null;

function getOrCreateAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  const encodedServiceAccount = process.env.FIREBASE_ADMIN_SDK_CONFIG_B64;

  if (!encodedServiceAccount) {
    throw new Error('Firebase Admin SDK initialization failed: The FIREBASE_ADMIN_SDK_CONFIG_B64 environment variable is not set.');
  }

  const serviceAccountJson = Buffer.from(encodedServiceAccount, 'base64').toString('utf8');
  const serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount;

  if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error('Parsed service account is invalid or missing essential properties (project_id, client_email, private_key). Please re-generate it following the backend-setup.md guide.');
  }
  
  // Use the default app instance if it already exists.
  if (getApps().length > 0) {
      adminApp = getApps()[0];
  } else {
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
  }

  return adminApp;
}

export function getAdminApp(): { app: App | null; error: string | null } {
  try {
    const app = getOrCreateAdminApp();
    return { app, error: null };
  } catch (error: any) {
    const errorMessage = `Firebase Admin SDK initialization failed: ${error.message}`;
    console.error(errorMessage, error);
    return { app: null, error: errorMessage };
  }
}

export async function verifyAdmin(req: NextRequest) {
    const app = getOrCreateAdminApp();

    const authorization = req.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
        throw new Error('Unauthorized: Missing or invalid token.');
    }
    const token = authorization.split('Bearer ')[1];
    
    const adminAuth = getAuth(app);
    const decodedToken = await adminAuth.verifyIdToken(token);
    const isAdmin = decodedToken.email === 'mkoton100@gmail.com' || decodedToken.email === 'beyondtransport@gmail.com';

    if (!isAdmin) {
        throw new Error("Forbidden: Admin access required.");
    }
    
    return {
        db: getFirestore(app),
        adminUid: decodedToken.uid
    };
}
