
import { getAdminApp } from '@/lib/firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';

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


export async function GET() {
    const { app, error: initError } = getAdminApp();
    if (initError || !app) {
        return NextResponse.json({ success: false, error: `Server error: ${initError}` }, { status: 500 });
    }
    
    const db = getFirestore(app);

    try {
        const shopsRef = db.collection('shops');
        const snapshot = await shopsRef.where('status', '==', 'approved').get();
        
        if (snapshot.empty) {
            return NextResponse.json({ success: true, data: [] });
        }
        
        const approvedShops = snapshot.docs.map(doc => {
            const data = doc.data();
            const serializedData = serializeTimestamps(data);
            return { id: doc.id, ...serializedData };
        });
        
        return NextResponse.json({ success: true, data: approvedShops });

    } catch (error: any) {
        console.error('Error fetching approved shops:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
