
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

  const authorization = headers().get('authorization');
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
    
    const pathSegments = path.split('/');
    if (pathSegments.length < 2 || pathSegments[0] !== 'members' || pathSegments[1] !== uid) {
        return NextResponse.json({ success: false, error: 'Forbidden: You can only modify your own data.' }, { status: 403 });
    }

    const db = getFirestore(app);
    const docRef = db.doc(path);
    
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
