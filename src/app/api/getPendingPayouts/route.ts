
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { verifyAdmin } from '@/lib/firebase-admin';

// Helper to convert Firestore Timestamps to JSON-serializable strings
function serializeTimestamps(docData: any): any {
    if (!docData) return docData;
    const newDocData: { [key: string]: any } = {};
    for (const key in docData) {
        const value = docData[key];
        if (value instanceof Timestamp) {
            newDocData[key] = value.toDate().toISOString();
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            newDocData[key] = serializeTimestamps(value);
        } else {
            newDocData[key] = value;
        }
    }
    return newDocData;
}

// Changed from GET to POST to avoid potential caching issues.
export async function POST(req: NextRequest) {
    try {
        const { db } = await verifyAdmin(req);
        
        // REMOVED: .orderBy('createdAt', 'desc') to avoid the complex index requirement.
        // Sorting will be handled on the client side.
        const payoutsSnap = await db.collectionGroup('payoutRequests').where('status', '==', 'pending').get();
        
        if (payoutsSnap.empty) {
            return NextResponse.json({ success: true, data: [] });
        }

        const data = payoutsSnap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
        
        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error(`API Error in /api/getPendingPayouts:`, error);
        const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Unauthorized') ? 401 : 500;
        return NextResponse.json({ success: false, error: error.message }, { status });
    }
}
