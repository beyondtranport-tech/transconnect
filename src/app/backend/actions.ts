
'use server';

import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminApp(): { app: App | null, error: string | null } {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    // The private key needs to have its newlines properly formatted.
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    // Detailed logging for debugging
    console.log("--- Admin App Initialization ---");
    console.log("Project ID available:", !!projectId);
    console.log("Client Email available:", !!clientEmail);
    console.log("Private Key available:", !!privateKey);
    
    if (!projectId) {
        const error = "Admin SDK Error: NEXT_PUBLIC_FIREBASE_PROJECT_ID is not defined in .env file.";
        console.error(error);
        return { app: null, error };
    }
    if (!clientEmail) {
        const error = "Admin SDK Error: FIREBASE_CLIENT_EMAIL is not defined in .env file.";
        console.error(error);
        return { app: null, error };
    }
    if (!privateKey) {
        const error = "Admin SDK Error: FIREBASE_PRIVATE_KEY is not defined in .env file.";
        console.error(error);
        return { app: null, error };
    }

    const serviceAccount = {
      projectId,
      clientEmail,
      privateKey,
    };
    
    // Use a unique name for the admin app to avoid conflicts
    const adminAppName = 'firebase-admin-app-transconnect';
    const existingApp = getApps().find(app => app.name === adminAppName);
    if (existingApp) {
        return { app: existingApp, error: null };
    }
    
    try {
        const app = initializeApp({
            credential: cert(serviceAccount),
        }, adminAppName);
        console.log("--- Admin App Initialized Successfully ---");
        return { app, error: null };
    } catch (error: any) {
        console.error("--- Admin App Initialization Failed ---");
        console.error("Error initializing admin app:", error.message);
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

// DIAGNOSTIC ACTION
export async function getMembers(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        // Instead of fetching members, return the environment variables.
        const envKeys = Object.keys(process.env);
        return { success: true, data: envKeys };
    } catch (error: any) {
        console.error('Error reading process.env:', error);
        return { success: false, error: `Failed to read server environment: ${error.message}` };
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
