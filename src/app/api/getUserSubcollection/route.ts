
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

// Helper to convert Firestore Timestamps to JSON-serializable strings
function serializeTimestamps(docData: any): any {
    if (!docData) return docData;
    const newDocData: { [key: string]: any } = {};
    for (const key in docData) {
        const value = docData[key];
        if (value instanceof Timestamp) {
            newDocData[key] = value.toDate().toISOString();
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            // Correctly handle nested objects
            newDocData[key] = serializeTimestamps(value);
        } else {
            newDocData[key] = value;
        }
    }
    return newDocData;
}


export async function POST(req: NextRequest) {
    const { app, error: initError } = getAdminApp();
    if (initError || !app) {
        return NextResponse.json({ success: false, error: `Internal Server Error: Could not connect to Firebase. ${initError}` }, { status: 500 });
    }

    const { path, type } = await req.json();

    if (!path || !type) {
        return NextResponse.json({ success: false, error: 'Bad Request: "path" and "type" are required.' }, { status: 400 });
    }
    
    // Public paths that do not require any authentication
    const publicPrefixes = ['/shops', '/memberships', '/configuration'];
    const isPublicPath = publicPrefixes.some(prefix => path.startsWith(prefix));
    
    // If it's a public path, we can proceed without checking for a token.
    if (!isPublicPath) {
        const headersList = headers();
        const authorization = headersList.get('authorization');
        let isAdmin = false;
        let uid: string | null = null;

        if (authorization && authorization.startsWith('Bearer ')) {
            const idToken = authorization.split('Bearer ')[1];
            try {
                const adminAuth = getAuth(app);
                const decodedToken = await adminAuth.verifyIdToken(idToken);
                uid = decodedToken.uid;
                isAdmin = decodedToken.email === 'beyondtransport@gmail.com';

                const pathSegments = path.split('/');
                const isOwner = uid && pathSegments.length >= 2 && pathSegments[0] === 'members' && pathSegments[1] === uid;

                if (!isAdmin && !isOwner) {
                     return NextResponse.json({ success: false, error: 'Forbidden: You do not have permission to access this resource.' }, { status: 403 });
                }

            } catch (error: any) {
                 return NextResponse.json({ success: false, error: 'Unauthorized: Invalid token.' }, { status: 401 });
            }
        } else {
            return NextResponse.json({ success: false, error: 'Unauthorized: No token provided for a private route.' }, { status: 401 });
        }
    }
    
    const db = getFirestore(app);
    try {
        if (type === 'collection') {
            const collectionRef = db.collection(path);
            const snapshot = await collectionRef.get();
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
            return NextResponse.json({ success: true, data });
        } else if (type === 'document') {
            const docRef = db.doc(path);
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                return NextResponse.json({ success: true, data: { id: docSnap.id, ...serializeTimestamps(docSnap.data()) } });
            } else {
                return NextResponse.json({ success: true, data: null });
            }
        } else if (type === 'collection-group') {
             const collectionGroupRef = db.collectionGroup(path);
             const snapshot = await collectionGroupRef.get();
             const data = snapshot.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
             return NextResponse.json({ success: true, data });
        } else {
             return NextResponse.json({ success: false, error: 'Bad Request: "type" must be "collection", "document", or "collection-group".' }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Error fetching path "${path}":`, error);
        return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
    }
}
