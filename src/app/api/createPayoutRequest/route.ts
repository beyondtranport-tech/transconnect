
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

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
    const { companyId, amount } = await req.json();
    if (!companyId || typeof amount !== 'number' || amount <= 0) {
        return NextResponse.json({ success: false, error: 'Bad Request: "companyId" and a valid "amount" are required.' }, { status: 400 });
    }
      
    const adminAuth = getAuth(app);
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    const db = getFirestore(app);

    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.data()?.companyId !== companyId) {
        return NextResponse.json({ success: false, error: 'Forbidden: You can only request payouts for your own company.' }, { status: 403 });
    }

    const companyDoc = await db.collection('companies').doc(companyId).get();
    const companyData = companyDoc.data();

    if (!companyData || (companyData.walletBalance || 0) < amount) {
        return NextResponse.json({ success: false, error: 'Insufficient wallet balance.' }, { status: 400 });
    }

    const collectionRef = db.collection(`companies/${companyId}/payoutRequests`);
    const newDocRef = collectionRef.doc();
    
    const payoutData = {
        id: newDocRef.id,
        userId: uid,
        companyId: companyId,
        amount,
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
    };
    
    await newDocRef.set(payoutData);

    return NextResponse.json({ success: true, id: newDocRef.id, message: 'Payout request submitted successfully.' });

  } catch (error: any) {
    console.error(`Error in createPayoutRequest:`, error);
    if (error.code === 'auth/id-token-expired') {
       return NextResponse.json({ success: false, error: 'Authentication token has expired.' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
