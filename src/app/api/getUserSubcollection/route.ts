
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
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            newDocData[key] = serializeTimestamps(value); // Recursively serialize nested objects
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
    const publicPrefixes = ['memberships', 'configuration'];
    const isPublicPath = publicPrefixes.some(prefix => path.startsWith(prefix)) || (path.startsWith('shops') && type !== 'collection-group');

    const headersList = headers();
    const authorization = headersList.get('authorization');
    const idToken = authorization?.split('Bearer ')[1];
    
    // For non-public paths, a token is required
    if (!isPublicPath && !idToken) {
        return NextResponse.json({ success: false, error: 'Unauthorized: No token provided for a private route.' }, { status: 401 });
    }
    
    try {
        const adminAuth = getAuth(app);
        const db = getFirestore(app);
        let decodedToken;

        if (idToken) {
            decodedToken = await adminAuth.verifyIdToken(idToken);
        }

        const isAdmin = decodedToken?.email === 'beyondtransport@gmail.com';

        // Admin can access everything
        if (isAdmin) {
            // Proceed without further checks
        } else if (isPublicPath) {
            // Public paths are allowed for everyone
        } else if (decodedToken) {
             // Non-admin user authorization logic for private paths
            const uid = decodedToken.uid;
            const pathSegments = path.split('/');
            
            let isAuthorized = false;
            
            // Allow access to own user document
            if (pathSegments.length >= 2 && pathSegments[0] === 'users' && pathSegments[1] === uid) {
                 isAuthorized = true;
            }
            // Allow access to own company and its subcollections
            else if (pathSegments.length >= 2 && pathSegments[0] === 'companies') {
                const companyId = pathSegments[1];
                const companyDoc = await db.collection('companies').doc(companyId).get();
                if (companyDoc.exists && companyDoc.data()?.ownerId === uid) {
                    isAuthorized = true;
                }
            }

            if (!isAuthorized) {
                return NextResponse.json({ success: false, error: 'Forbidden: You do not have permission to access this resource.' }, { status: 403 });
            }
        } else {
            // This should already be caught by the idToken check, but as a fallback.
            return NextResponse.json({ success: false, error: 'Unauthorized: Invalid request for private route.' }, { status: 401 });
        }


        // --- Data Fetching Logic ---
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
        console.error(`Error in API route for path "${path}":`, error);
        if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
           return NextResponse.json({ success: false, error: 'Unauthorized: Invalid token.' }, { status: 401 });
        }
        return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
    }
}
