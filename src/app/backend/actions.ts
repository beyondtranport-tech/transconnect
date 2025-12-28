
'use server';

import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminApp(): App | null {
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
        console.error("Firebase admin environment variables are not set.");
        return null;
    }

    const serviceAccount = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
    
    if (getApps().some(app => app.name === 'admin')) {
        return getApps().find(app => app.name === 'admin')!;
    }
    
    return initializeApp({
        credential: cert(serviceAccount),
    }, 'admin');
}

interface Member {
    id: string;
    [key: string]: any;
}

interface FinanceApplication {
    id: string;
    [key: string]: any;
}

export async function getMembers(): Promise<{ success: boolean; data?: Member[]; error?: string }> {
    const adminApp = getAdminApp();
    if (!adminApp) {
        return { success: false, error: 'Firebase Admin SDK is not initialized. Missing environment variables.' };
    }
    const adminDb = getFirestore(adminApp);
    
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
    const adminApp = getAdminApp();
    if (!adminApp) {
        return { success: false, error: 'Firebase Admin SDK is not initialized. Missing environment variables.' };
    }
    const adminDb = getFirestore(adminApp);

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
