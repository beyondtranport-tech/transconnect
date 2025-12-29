'use server';

import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

function getAdminApp(): { app: App | null, error: string | null } {
    const adminSdkConfigB64 = process.env.FIREBASE_ADMIN_SDK_CONFIG_B64;

    if (!adminSdkConfigB64) {
        const error = "Admin SDK Error: FIREBASE_ADMIN_SDK_CONFIG_B64 is not defined in the environment. Please add it to your environment variables.";
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

export async function checkAdminSdk(): Promise<{ success: boolean; error?: string }> {
    const { app, error } = getAdminApp();
    if (error || !app) {
        return { success: false, error: error || 'Firebase Admin SDK could not be initialized.' };
    }
    return { success: true };
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

export async function getMemberById(memberId: string): Promise<{ success: boolean; data?: Member; error?: string }> {
    const { app, error: initError } = getAdminApp();
    if (initError || !app) {
        return { success: false, error: initError || 'Firebase Admin SDK could not be initialized.' };
    }
    const adminDb = getFirestore(app);

    try {
        const memberRef = adminDb.collection('members').doc(memberId);
        const docSnap = await memberRef.get();

        if (docSnap.exists()) {
            const data = docSnap.data();
            const serializedData = serializeTimestamps(data);
            return { success: true, data: { id: docSnap.id, ...serializedData } as Member };
        } else {
            return { success: false, error: 'Member not found.' };
        }
    } catch (error: any) {
        console.error(`Error fetching member ${memberId}:`, error);
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
        const appMap = new Map<string, FinanceApplication>();
        const formalFundingTypes = ["asset_finance", "working_capital", "partnership", "credit-top-up", "membership_payment"];

        // 1. Query the top-level collection for formal funding types
        const topLevelSnapshot = await adminDb.collection('financeApplications').where('fundingType', 'in', formalFundingTypes).get();
        topLevelSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const serializedData = serializeTimestamps(data);
            appMap.set(doc.id, { id: doc.id, ...serializedData } as FinanceApplication);
        });

        // 2. Query the subcollections using a collection group query for formal funding types
        const subCollectionSnapshot = await adminDb.collectionGroup('financeApplications').where('fundingType', 'in', formalFundingTypes).get();
        subCollectionSnapshot.docs.forEach(doc => {
            // Avoid adding duplicates if the ID already exists from the top-level query
            if (!appMap.has(doc.id)) {
                const data = doc.data();
                const serializedData = serializeTimestamps(data);
                appMap.set(doc.id, { id: doc.id, ...serializedData } as FinanceApplication);
            }
        });
        
        const allApps = Array.from(appMap.values());

        // Sort by creation date, most recent first
        const sortedApps = allApps.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });

        return { success: true, data: sortedApps };

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
        // Use a Collection Group query to get all shops from subcollections
        const memberShopsSnapshot = await adminDb.collectionGroup('shops').get();
        
        const shopMap = new Map<string, Shop>();

        memberShopsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const serializedData = serializeTimestamps(data);
            const shop = {
                id: doc.id,
                ...serializedData,
            } as Shop;
            // The collectionGroup query will find shops under 'members'
            // We give priority to these as they are the source of truth
            shopMap.set(shop.id, shop);
        });

        // Now, separately query the top-level 'shops' collection for any approved shops
        // This ensures we get approved shops that might not have been picked up if the member doc was odd.
        const publicShopsSnapshot = await adminDb.collection('shops').get();
        publicShopsSnapshot.docs.forEach(doc => {
            // Only add to the map if it doesn't already exist from the more specific query
            if (!shopMap.has(doc.id)) {
                 const data = doc.data();
                 const serializedData = serializeTimestamps(data);
                 const shop = {
                    id: doc.id,
                    ...serializedData,
                 } as Shop;
                 shopMap.set(shop.id, shop);
            }
        });

        const allShops = Array.from(shopMap.values());
        
        // Sort the combined list by creation date
        const sortedShops = allShops.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
        
        return { success: true, data: sortedShops };

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

export async function getAllTransactions(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    const { app, error: initError } = getAdminApp();
    if (initError || !app) {
        return { success: false, error: initError || 'Firebase Admin SDK could not be initialized.' };
    }
    const adminDb = getFirestore(app);

    try {
        const transactionsSnapshot = await adminDb.collectionGroup('transactions').orderBy('date', 'desc').get();
        const transactions = transactionsSnapshot.docs.map(doc => {
            const data = doc.data();
            const serializedData = serializeTimestamps(data);
            return {
                id: doc.id,
                ...serializedData,
            } as any;
        });
        return { success: true, data: transactions };
    } catch (error: any) {
        console.error('Error fetching all transactions with admin SDK:', error);
        return { success: false, error: error.message };
    }
}
