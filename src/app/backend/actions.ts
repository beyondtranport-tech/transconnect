
'use server';

import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

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
        
        if (!serviceAccount.private_key) {
             const error = "Admin SDK Error: Parsed service account is missing 'private_key'. This is likely due to an issue with the environment variable decoding.";
             console.error(error, "Decoded length:", decodedConfig.length);
             return { app: null, error };
        }

        const adminAppName = 'firebase-admin-app-transconnect';
        const existingApp = getApps().find(app => app.name === adminAppName);

        if (existingApp) {
            return { app: existingApp, error: null };
        }
        
        const app = initializeApp({
            credential: cert(serviceAccount),
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        }, adminAppName);
        return { app, error: null };

    } catch (error: any) {
        console.error("Admin SDK Initialization Failed:", error.message);
        return { app: null, error: `Firebase Admin SDK initialization failed: ${error.message}` };
    }
}

// Helper to convert Firestore Timestamps to JSON-serializable strings
function serializeTimestamps(docData: any) {
    if (!docData) return docData;
    const newDocData: { [key: string]: any } = {};
    for (const key in docData) {
        const value = docData[key];
        if (value instanceof Timestamp) {
            newDocData[key] = value.toDate().toISOString();
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            newDocData[key] = serializeTimestamps(value); // Recursively serialize nested objects
        } else {
            newDocData[key] = value;
        }
    }
    return newDocData;
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

interface Shop {
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
        const members = membersSnapshot.docs.map(doc => {
            const data = doc.data();
            const serializedData = serializeTimestamps(data);
            return {
                id: doc.id,
                ...serializedData,
            } as Member;
        });
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
        const applications = applicationsSnapshot.docs.map(doc => {
            const data = doc.data();
            const serializedData = serializeTimestamps(data);
            return {
                id: doc.id,
                ...serializedData,
            } as FinanceApplication;
        });
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
        const contributions = contributionsSnapshot.docs.map(doc => {
             const data = doc.data();
             const serializedData = serializeTimestamps(data);
             return {
                id: doc.id,
                ...serializedData,
            } as Contribution;
        });
        return { success: true, data: contributions };
    } catch (error: any) {
        console.error('Error fetching contributions with admin SDK:', error);
        return { success: false, error: error.message };
    }
}

export async function getShops(): Promise<{ success: boolean; data?: Shop[]; error?: string }> {
    const { app, error: initError } = getAdminApp();
    if (initError || !app) {
        return { success: false, error: initError || 'Firebase Admin SDK could not be initialized.' };
    }
    const adminDb = getFirestore(app);

    try {
        // Use a collection group query to get all shops from all members
        const shopsSnapshot = await adminDb.collectionGroup('shops').orderBy('createdAt', 'desc').get();
        const shops = shopsSnapshot.docs.map(doc => {
            const data = doc.data();
            const serializedData = serializeTimestamps(data);
            return {
                id: doc.id,
                ...serializedData,
            } as Shop;
        });
        return { success: true, data: shops };
    } catch (error: any) {
        console.error('Error fetching shops with admin SDK:', error);
        return { success: false, error: error.message };
    }
}

export async function approveShop(shopId: string, ownerId: string): Promise<{ success: boolean; error?: string }> {
    const { app, error: initError } = getAdminApp();
    if (initError || !app) {
        return { success: false, error: initError || 'Firebase Admin SDK could not be initialized.' };
    }
    const adminDb = getFirestore(app);
    
    try {
        const memberShopRef = adminDb.doc(`members/${ownerId}/shops/${shopId}`);
        const publicShopRef = adminDb.doc(`shops/${shopId}`);
        
        const shopDoc = await memberShopRef.get();
        if (!shopDoc.exists) {
            throw new Error(`Shop with ID ${shopId} not found for member ${ownerId}.`);
        }
        
        const shopData = shopDoc.data();
        
        const batch = adminDb.batch();
        
        // 1. Create/update the public shop document
        batch.set(publicShopRef, { ...shopData, status: 'approved', updatedAt: Timestamp.now() });
        
        // 2. Update the member's shop status
        batch.update(memberShopRef, { status: 'approved', updatedAt: Timestamp.now() });
        
        await batch.commit();
        
        return { success: true };

    } catch (error: any) {
        console.error(`Error approving shop ${shopId}:`, error);
        return { success: false, error: error.message };
    }
}
