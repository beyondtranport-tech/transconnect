
'use server';

import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminApp(): { app: App | null, error: string | null } {
    const adminSdkConfigB64 = process.env.FIREBASE_ADMIN_SDK_CONFIG_B64;

    if (!adminSdkConfigB64) {
        const error = "Admin SDK Error: FIREBASE_ADMIN_SDK_CONFIG_B64 is not defined in the environment.";
        console.error(error);
        return { app: null, error };
    }

    try {
        const decodedConfig = Buffer.from(adminSdkConfigB64, 'base64').toString('utf-8');
        const serviceAccount = JSON.parse(decodedConfig) as ServiceAccount;
        
        // Add a check for the private_key to be sure
        if (!serviceAccount.private_key) {
             const error = "Admin SDK Error: Parsed service account is missing 'private_key'.";
             console.error(error);
             return { app: null, error };
        }

        const adminAppName = 'firebase-admin-app-transconnect';
        const existingApp = getApps().find(app => app.name === adminAppName);

        if (existingApp) {
            return { app: existingApp, error: null };
        }
        
        const app = initializeApp({
            credential: cert(serviceAccount),
        }, adminAppName);
        return { app, error: null };

    } catch (error: any) {
        console.error("Admin SDK Initialization Failed:", error.message);
        return { app: null, error: `Firebase Admin SDK initialization failed: ${error.message}` };
    }
}

interface Member {
    id: string;
    [key: string]: any;
}

interface FinanceApplication {
    id: string;
    [key: string]: any;
}

interface Contribution {
    id: string;
    [key: string]: any;
}


export async function getMembers(): Promise<{ success: boolean; data?: Member[]; error?: string }> {
    const { app, error: initError } = getAdminApp();
    if (initError || !app) {
        return { success: false, error: initError || 'Firebase Admin SDK could not be initialized.' };
    }
    const adminDb = getFirestore(app);

    try {
        const membersSnapshot = await adminDb.collection('members').orderBy('createdAt', 'desc').get();
        const members = membersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        return { success: true, data: members as Member[] };
    } catch (error: any) {
        console.error('Error fetching members with admin SDK:', error);
        return { success: false, error: error.message };
    }
}


export async function getFinanceApplications(): Promise<{ success: boolean; data?: FinanceApplication[]; error?: string }> {
    const { app, error: initError } = getAdminApp();
    if (initError || !app) {
        return { success: false, error: initError || 'Firebase Admin SDK could not be initialized.' };
    }
    const adminDb = getFirestore(app);

    try {
        const applicationsSnapshot = await adminDb.collection('financeApplications').orderBy('createdAt', 'desc').get();
        const applications = applicationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        return { success: true, data: applications };
    } catch (error: any) {
        console.error('Error fetching finance applications with admin SDK:', error);
        return { success: false, error: error.message };
    }
}

export async function getContributions(): Promise<{ success: boolean; data?: Contribution[]; error?: string }> {
    const { app, error: initError } = getAdminApp();
    if (initError || !app) {
        return { success: false, error: initError || 'Firebase Admin SDK could not be initialized.' };
    }
    const adminDb = getFirestore(app);

    try {
        const contributionsSnapshot = await adminDb.collection('contributions').orderBy('createdAt', 'desc').get();
        const contributions = contributionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        return { success: true, data: contributions };
    } catch (error: any) {
        console.error('Error fetching contributions with admin SDK:', error);
        return { success: false, error: error.message };
    }
}
