import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, FieldPath, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

// Helper to serialize Firestore Timestamps
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

export async function GET(req: NextRequest) {
    const { app, error: initError } = getAdminApp();
    if (initError || !app) {
        return NextResponse.json({ success: false, error: 'Internal Server Error: Could not connect to Firebase.' }, { status: 500 });
    }

    const authorization = req.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
        return NextResponse.json({ success: false, error: 'Unauthorized: Missing or invalid token.' }, { status: 401 });
    }
    const token = authorization.split('Bearer ')[1];

    try {
        const adminAuth = getAuth(app);
        const decodedToken = await adminAuth.verifyIdToken(token);
        const uid = decodedToken.uid;
        const db = getFirestore(app);

        // 1. Find all companies referred by the current user
        const companiesQuery = db.collection('companies').where('referrerId', '==', uid);
        const companiesSnap = await companiesQuery.get();

        if (companiesSnap.empty) {
            return NextResponse.json({ success: true, data: [] });
        }

        // 2. Get the owner IDs from the referred companies
        const ownerIds = companiesSnap.docs.map(doc => doc.data().ownerId);

        // 3. Fetch the user documents for these owners to get their email
        const usersSnap = await db.collection('users').where(FieldPath.documentId(), 'in', ownerIds).get();
        const userEmailMap = new Map<string, string>();
        usersSnap.forEach(doc => {
            userEmailMap.set(doc.id, doc.data().email);
        });

        // 4. Combine the data
        const networkData = companiesSnap.docs.map(doc => {
            const companyData = doc.data();
            return {
                ...serializeTimestamps(companyData),
                ownerEmail: userEmailMap.get(companyData.ownerId) || 'N/A'
            };
        });

        return NextResponse.json({ success: true, data: networkData });

    } catch (error: any) {
        console.error('Error in /api/getNetwork:', error);
        if (error.code?.startsWith('auth/')) {
            return NextResponse.json({ success: false, error: 'Authentication error.' }, { status: 401 });
        }
        return NextResponse.json({ success: false, error: 'Internal Server Error.' }, { status: 500 });
    }
}