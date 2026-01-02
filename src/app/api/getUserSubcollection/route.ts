
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
        console.error("Admin SDK init error:", initError);
        return NextResponse.json({ success: false, error: `Internal Server Error: Could not connect to Firebase. ${initError}` }, { status: 500 });
    }

    const { path, type } = await req.json();

    if (!path || !type) {
        return NextResponse.json({ success: false, error: 'Bad Request: "path" and "type" are required.' }, { status: 400 });
    }

    const headersList = headers();
    const authorization = headersList.get('authorization');
    const idToken = authorization?.split('Bearer ')[1];

    const publicPrefixes = ['memberships', 'configuration', 'shops'];
    const isPublicPath = publicPrefixes.some(prefix => path.startsWith(prefix));

    try {
        const db = getFirestore(app);
        const adminAuth = getAuth(app);
        let decodedToken;
        
        if (idToken) {
            decodedToken = await adminAuth.verifyIdToken(idToken);
        } else if (!isPublicPath) {
            return NextResponse.json({ success: false, error: 'Unauthorized: No token provided for a private route.' }, { status: 401 });
        }

        const isAdmin = decodedToken?.email === 'beyondtransport@gmail.com';
        const uid = decodedToken?.uid;
        
        if (!isAdmin && !isPublicPath) {
            let isAuthorized = false;
            const pathSegments = path.split('/');

            if (pathSegments.length >= 2 && pathSegments[0] === 'members' && pathSegments[1] === uid) {
                 isAuthorized = true;
            }
            
            if (!isAuthorized) {
                 return NextResponse.json({ success: false, error: 'Forbidden: You do not have permission to access this resource.' }, { status: 403 });
            }
        }
        
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
             const data = snapshot.docs.map(doc => {
                const docData = doc.data();
                const pathSegments = doc.ref.path.split('/');
                let memberId = null;
                const membersIndex = pathSegments.indexOf('members');
                if (membersIndex > -1 && membersIndex < pathSegments.length - 1) {
                    memberId = pathSegments[membersIndex + 1];
                }
                
                return { 
                    id: doc.id, 
                    memberId, 
                    ...serializeTimestamps(docData) 
                };
             });
             return NextResponse.json({ success: true, data });
        } else {
             return NextResponse.json({ success: false, error: 'Bad Request: "type" must be "collection", "document", or "collection-group".' }, { status: 400 });
        }

    } catch (error: any) {
        console.error(`API Error in route for path "${path}":`, error);
        if (error.code === 'auth/id-token-expired' || error.code?.includes('auth/')) {
           return NextResponse.json({ success: false, error: 'Unauthorized: Invalid token.' }, { status: 401 });
        }
        return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
    }
}
