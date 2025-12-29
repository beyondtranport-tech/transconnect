
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

// Helper to convert Firestore Timestamps and other non-serializable types
function serializeData(docData: any) {
    if (!docData) return docData;
    const newDocData: { [key: string]: any } = {};
    for (const key in docData) {
        const value = docData[key];
        if (value instanceof Timestamp) {
            newDocData[key] = value.toDate().toISOString();
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            // Recursively serialize nested objects
            newDocData[key] = serializeData(value);
        } else {
            newDocData[key] = value;
        }
    }
    return newDocData;
}


export async function POST(req: NextRequest) {
  const { app, error: initError } = getAdminApp();
  if (initError || !app) {
    console.error('Failed to initialize Firebase Admin SDK in API route:', initError);
    return NextResponse.json({ success: false, error: 'Internal Server Error: Could not connect to Firebase.' }, { status: 500 });
  }

  const headersList = headers();
  const authorization = headersList.get('authorization');
  const { path, type } = await req.json();

  if (!path || !type || (type !== 'document' && type !== 'collection')) {
      return NextResponse.json({ success: false, error: 'Bad Request: "path" and "type" are required.' }, { status: 400 });
  }

  const db = getFirestore(app);
  let uid: string | null = null;
  let userEmail: string | null = null;
  let isAdmin = false;

  // --- Authentication and Authorization ---
  if (authorization && authorization.startsWith('Bearer ')) {
    const idToken = authorization.split('Bearer ')[1];
    try {
        const adminAuth = getAuth(app);
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        uid = decodedToken.uid;
        userEmail = decodedToken.email || null;
        isAdmin = userEmail === 'beyondtransport@gmail.com';
    } catch (error: any) {
        // Token is invalid or expired
        if (error.code === 'auth/id-token-expired') {
            return NextResponse.json({ success: false, error: 'Authentication token has expired.' }, { status: 401 });
        }
        // Don't fail the request, just proceed as an unauthenticated user
        console.warn('Token verification failed, proceeding as unauthenticated:', error.code);
    }
  }

  try {
    // --- Security Checks ---
    const pathSegments = path.split('/');
    const isPublicShopPath = pathSegments[0] === 'shops';
    const isMemberPath = pathSegments.length >= 2 && pathSegments[0] === 'members';
    
    // Allow public access to the /shops collection and its subcollections
    if (isPublicShopPath) {
        // No further checks needed, this path is public
    } else if (isAdmin) {
        // Admin can access anything
    } else if (isMemberPath && uid === pathSegments[1]) {
        // Authenticated user is accessing their own data
    } else {
        // If none of the above conditions are met, deny access.
        // This occurs for unauthenticated users on private paths, or users trying to access other's data.
        return NextResponse.json({ success: false, error: 'Forbidden: You do not have permission to access this resource.' }, { status: 403 });
    }

    // --- Data Fetching ---
    if (type === 'document') {
        const docRef = db.doc(path);
        const docSnap = await docRef.get();

        if (docSnap.exists()) {
            const docData = docSnap.data();
            const serializedData = serializeData(docData);
            return NextResponse.json({ success: true, data: { id: docSnap.id, ...serializedData } });
        } else {
            return NextResponse.json({ success: true, data: null });
        }
    } else if (type === 'collection') {
        const collectionRef = db.collection(path);
        const querySnapshot = await collectionRef.get();
        const data = querySnapshot.docs.map(doc => {
            const docData = doc.data();
            const serializedData = serializeData(docData);
            return { id: doc.id, ...serializedData };
        });
        return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ success: false, error: 'Invalid type specified.' }, { status: 400 });

  } catch (error: any) {
    console.error(`Error in getUserSubcollection for path "${path}":`, error);
    return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
