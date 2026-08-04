import { initializeApp, getApps, getApp, App, cert } from 'firebase-admin/app';
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const ADMIN_APP_NAME = 'firebase-admin-app-transconnect-studio-v7';

let adminApp: App | null = null;
let adminAppError: string | null = null;

function initializeAdminApp(): { app: App; error: null } | { app: null; error: string } {
    if (adminApp) {
        return { app: adminApp, error: null };
    }

    try {
        const existingApp = getApp(ADMIN_APP_NAME);
        adminApp = existingApp;
        return { app: adminApp, error: null };
    } catch (e) {
        // App not initialized
    }
    
    // FORENSIC SANITIZATION: Clean the B64 string before processing
    const rawB64 = process.env.FIREBASE_ADMIN_SDK_CONFIG_B64;
    const encodedServiceAccount = rawB64?.replace(/[\r\n\s]/gm, '').trim();

    if (!encodedServiceAccount) {
        adminAppError = 'Firebase Admin SDK initialization failed: The FIREBASE_ADMIN_SDK_CONFIG_B64 environment variable is not set.';
        console.error(adminAppError);
        return { app: null, error: adminAppError };
    }

    try {
        const decodedString = Buffer.from(encodedServiceAccount, 'base64').toString('utf8');
        
        // ROBUST EXTRACTION: Find the actual JSON object bounds.
        // This strips accidental "json" prefixes or markdown code blocks.
        const startIdx = decodedString.indexOf('{');
        const endIdx = decodedString.lastIndexOf('}');
        
        if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
            throw new Error('Decoded Base64 does not contain a valid JSON object.');
        }
        
        const serviceAccountJson = decodedString.substring(startIdx, endIdx + 1);
        const serviceAccountObject = JSON.parse(serviceAccountJson);

        if (!serviceAccountObject.project_id || !serviceAccountObject.client_email || !serviceAccountObject.private_key) {
            throw new Error('Parsed service account is missing project_id, client_email, or private_key.');
        }

        const app = initializeApp({
            credential: cert(serviceAccountObject),
            projectId: serviceAccountObject.project_id,
        }, ADMIN_APP_NAME);
        
        adminApp = app;
        return { app: adminApp, error: null };

    } catch (error: any) {
        const errorMessage = `Firebase Admin SDK initialization failed: ${error.message}`;
        console.error(errorMessage);
        adminAppError = errorMessage;
        return { app: null, error: errorMessage };
    }
}


export function getAdminApp(): { app: App; error: null } | { app: null; error: string } {
    if (adminApp && !adminAppError) {
        return { app: adminApp, error: null };
    }
    if (adminAppError) {
        return { app: null, error: adminAppError };
    }
    return initializeAdminApp();
}

export async function verifyAdmin(req: NextRequest) {
    const { app, error: initError } = getAdminApp();
    if (initError || !app) {
        throw new Error(`Admin SDK failed: ${initError}`);
    }

    const authorization = req.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
        throw new Error('Unauthorized: Missing or invalid token.');
    }
    const token = authorization.split('Bearer ')[1];
    
    const adminAuth = getAuth(app);
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    const adminEmails = ['mkoton100@gmail.com', 'beyondtransport@gmail.com', 'michael@logisticsflow.co.za'];
    const isAdmin = adminEmails.includes(decodedToken.email || '') || decodedToken.admin === true;

    if (!isAdmin) {
        throw new Error("Forbidden: Admin access required.");
    }
    
    return {
        db: getFirestore(app),
        adminUid: decodedToken.uid
    };
}
