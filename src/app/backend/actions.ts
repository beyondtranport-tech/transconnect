
'use server';

import 'dotenv/config';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminApp(): { app: App | null, error: string | null } {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

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
      privateKey: privateKey.replace(/\\n/g, '\n'),
    };
    
    if (getApps().some(app => app.name === 'admin')) {
        return { app: getApps().find(app => app.name === 'admin')!, error: null };
    }
    
    try {
        const app = initializeApp({
            credential: cert(serviceAccount),
        }, 'admin');
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

export async function getMembers(): Promise<{ success: boolean; data?: Member[]; error?: string }> {
    const { app, error: initError } = getAdminApp();
    if (initError || !app) {
        return { success: false, error: initError || 'Firebase Admin SDK could not be initialized.' };
    }
    const adminDb = getFirestore(app);
    
    try {
        const membersSnapshot = await adminDb.collection('members').get();
        const members = membersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        return { success: true, data: members };
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
