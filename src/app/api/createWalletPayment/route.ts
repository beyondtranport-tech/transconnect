import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
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

  const authorization = req.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'Unauthorized: No token provided.' }, { status: 401 });
  }

  const idToken = authorization.split('Bearer ')[1];
  
  try {
    const { data } = await req.json();
    if (!data) {
        return NextResponse.json({ success: false, error: 'Bad Request: "data" is required.' }, { status: 400 });
    }
      
    const adminAuth = getAuth(app);
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    const db = getFirestore(app);

    // --- NEW LOGIC ---
    let companyId = data.companyId;

    // If companyId is not provided in the payload, look it up from the user's document.
    if (!companyId) {
        const userDoc = await db.collection('users').doc(uid).get();
        companyId = userDoc.data()?.companyId;
    }

    if (!companyId) {
        return NextResponse.json({ success: false, error: 'Could not find an associated company for this user. The profile may still be setting up.' }, { status: 404 });
    }
    // --- END NEW LOGIC ---
    
    const collectionPath = `companies/${companyId}/walletPayments`;
    const collectionRef = db.collection(collectionPath);
    
    const finalData = {
        ...deserializeData(data),
        userId: uid,
        companyId: companyId,
    };
    
    const newDocRef = collectionRef.doc();
    await newDocRef.set({ ...finalData, id: newDocRef.id });

    return NextResponse.json({ success: true, id: newDocRef.id, message: 'Wallet payment created successfully.' });

  } catch (error: any) {
    console.error(`Error in createWalletPayment:`, error);
    if (error.code === 'auth/id-token-expired') {
       return NextResponse.json({ success: false, error: 'Authentication token has expired.' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
