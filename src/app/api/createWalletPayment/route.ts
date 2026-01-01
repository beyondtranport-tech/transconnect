
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
    const { data } = await req.json();
    if (!data || !data.memberId) {
        return NextResponse.json({ success: false, error: 'Bad Request: "data" object with "memberId" is required.' }, { status: 400 });
    }

    const adminAuth = getAuth(app);
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Security check: Make sure the user owns the member they are adding a payment for.
    const db = getFirestore(app);
    const memberDoc = await db.collection('members').doc(data.memberId).get();
    if (!memberDoc.exists || memberDoc.data()?.ownerId !== uid) {
        return NextResponse.json({ success: false, error: 'Forbidden: You do not have permission to modify this member.' }, { status: 403 });
    }
    
    const collectionPath = `members/${data.memberId}/walletPayments`;
    const collectionRef = db.collection(collectionPath);
    
    const deserializedData = deserializeData(data);
    const newDocRef = await collectionRef.add(deserializedData);

    return NextResponse.json({ success: true, id: newDocRef.id, message: 'Wallet payment created successfully.' });

  } catch (error: any) {
    console.error(`Error in createWalletPayment:`, error);
    if (error.code === 'auth/id-token-expired') {
       return NextResponse.json({ success: false, error: 'Authentication token has expired.' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
