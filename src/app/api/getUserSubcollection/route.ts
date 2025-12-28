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
  
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'Unauthorized: No token provided.' }, { status: 401 });
  }

  const idToken = authorization.split('Bearer ')[1];
  
  const { path, type } = await req.json();

  if (!path || !type || (type !== 'document' && type !== 'collection')) {
      return NextResponse.json({ success: false, error: 'Bad Request: "path" and "type" are required.' }, { status: 400 });
  }

  try {
    const adminAuth = getAuth(app);
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Security Check: Ensure the requested path belongs to the authenticated user.
    // This assumes a path structure like "members/{userId}/..."
    const pathSegments = path.split('/');
    if (pathSegments.length < 2 || pathSegments[0] !== 'members' || pathSegments[1] !== uid) {
        return NextResponse.json({ success: false, error: 'Forbidden: You can only access your own data.' }, { status: 403 });
    }

    const db = getFirestore(app);

    if (type === 'document') {
        const docRef = db.doc(path);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
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

    // This should not be reached
    return NextResponse.json({ success: false, error: 'Invalid type specified.' }, { status: 400 });

  } catch (error: any) {
    console.error(`Error in getUserSubcollection for path "${path}":`, error);
    if (error.code === 'auth/id-token-expired') {
       return NextResponse.json({ success: false, error: 'Authentication token has expired.' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
