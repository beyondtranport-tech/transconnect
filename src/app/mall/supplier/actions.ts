'use server';

import { getAdminApp } from '@/lib/firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

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


export async function getApprovedShops(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    const { app, error: initError } = getAdminApp();
    if (initError || !app) {
        return { success: false, error: initError };
    }
    
    const db = getFirestore(app);

    try {
        const shopsRef = db.collection('shops');
        const snapshot = await shopsRef.where('status', '==', 'approved').get();
        
        if (snapshot.empty) {
            return { success: true, data: [] };
        }
        
        const approvedShops = snapshot.docs.map(doc => {
            const data = doc.data();
            const serializedData = serializeTimestamps(data);
            return { id: doc.id, ...serializedData };
        });
        
        return { success: true, data: approvedShops };

    } catch (error: any) {
        console.error('Error fetching approved shops:', error);
        return { success: false, error: error.message };
    }
}
