
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

function deserializeData(data: any): any {
    if (!data) return data;
    const newData: { [key: string]: any } = {};
    for (const key in data) {
        const value = data[key];
        if (value && typeof value === 'object' && value._methodName === 'serverTimestamp') {
            newData[key] = FieldValue.serverTimestamp();
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            newData[key] = deserializeData(value);
        } else {
            newData[key] = value;
        }
    }
    return newData;
}


export async function POST(req: NextRequest) {
  const { app, error: initError } = getAdminApp();
  if (initError || !app) {
    return NextResponse.json({ success: false, error: `Internal Server Error: ${initError}` }, { status: 500 });
  }

  const headersList = headers();
  const authorization = headersList.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'Unauthorized: No token provided.' }, { status: 401 });
  }

  const idToken = authorization.split('Bearer ')[1];
  
  try {
    const { path, data } = await req.json();
    if (!path || !data) {
        return NextResponse.json({ success: false, error: 'Bad Request: "path" and "data" are required.' }, { status: 400 });
    }

    const adminAuth = getAuth(app);
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    const db = getFirestore(app);
    const pathSegments = path.split('/');
    const docRef = db.doc(path);
    
    let isAuthorized = false;

    // A user can update their own user document
    if (pathSegments[0] === 'users' && pathSegments[1] === uid) {
        isAuthorized = true;
    }
    // A user can update their own company document
    else if (pathSegments[0] === 'companies' && pathSegments.length === 2) {
        const companySnap = await docRef.get();
        if (companySnap.exists && companySnap.data()?.ownerId === uid) {
            isAuthorized = true;
        }
    }
    // A user can update documents in their own company's subcollections (e.g., shops)
    else if (pathSegments[0] === 'companies' && pathSegments.length > 2 && pathSegments[1]) {
        const companyId = pathSegments[1];
        const companyRef = db.collection('companies').doc(companyId);
        const companySnap = await companyRef.get();
        if (companySnap.exists && companySnap.data()?.ownerId === uid) {
            isAuthorized = true;
        }
    }

    if (!isAuthorized) {
        return NextResponse.json({ success: false, error: 'Forbidden: You do not have permission to modify this resource.' }, { status: 403 });
    }

    const deserializedData = deserializeData(data);
    await docRef.update(deserializedData);

    return NextResponse.json({ success: true, message: 'Document updated successfully.' });

  } catch (error: any) {
    console.error(`Error in updateUserDoc:`, error);
    if (error.code === 'auth/id-token-expired') {
       return NextResponse.json({ success: false, error: 'Authentication token has expired.' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
