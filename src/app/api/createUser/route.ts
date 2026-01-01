
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

// Helper function to convert serverTimestamp placeholders
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
    return NextResponse.json({ success: false, error: 'Internal Server Error: Could not connect to Firebase.' }, { status: 500 });
  }

  const authorization = headers().get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'Unauthorized: No token provided.' }, { status: 401 });
  }

  const idToken = authorization.split('Bearer ')[1];
  
  try {
    const { data } = await req.json();
    if (!data || !data.id) {
        return NextResponse.json({ success: false, error: 'Bad Request: "data" object with a user ID is required.' }, { status: 400 });
    }
      
    const adminAuth = getAuth(app);
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Security check: Make sure the UID in the token matches the ID in the data payload.
    // This ensures a user can only create their own document.
    if (decodedToken.uid !== data.id) {
        return NextResponse.json({ success: false, error: 'Forbidden: You can only create your own user document.' }, { status: 403 });
    }
    
    const db = getFirestore(app);
    const docRef = db.collection('members').doc(data.id);
    
    const deserializedData = deserializeData(data);
    
    await docRef.set(deserializedData);

    return NextResponse.json({ success: true, id: docRef.id, message: 'User document created successfully.' });

  } catch (error: any) {
    console.error(`Error in createUser:`, error);
    if (error.code === 'auth/id-token-expired') {
       return NextResponse.json({ success: false, error: 'Authentication token has expired.' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
