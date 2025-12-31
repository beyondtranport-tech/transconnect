
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';


export async function POST(req: NextRequest) {
  const { app, error: initError } = getAdminApp();
  if (initError || !app) {
    return NextResponse.json({ success: false, error: 'Internal Server Error: Could not connect to Firebase.' }, { status: 500 });
  }

  const headersList = headers();
  const authorization = headersList.get('authorization');
  
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'Unauthorized: No token provided.' }, { status: 401 });
  }

  const idToken = authorization.split('Bearer ')[1];
  
  const { shopId, ownerId } = await req.json();

  if (!shopId || !ownerId) {
      return NextResponse.json({ success: false, error: 'Bad Request: "shopId" and "ownerId" are required.' }, { status: 400 });
  }

  try {
    const adminAuth = getAuth(app);
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Security Check: Only allow specific admin users to perform this action.
    if (decodedToken.email !== 'beyondtransport@gmail.com') {
         return NextResponse.json({ success: false, error: 'Forbidden: You do not have permission to approve shops.' }, { status: 403 });
    }

    const adminDb = getFirestore(app);
    const memberShopRef = adminDb.doc(`members/${ownerId}/shops/${shopId}`);
    const publicShopRef = adminDb.doc(`shops/${shopId}`);
    
    const shopDoc = await memberShopRef.get();
    if (!shopDoc.exists) {
        throw new Error(`Shop with ID ${shopId} not found for member ${ownerId}.`);
    }
    
    const shopData = shopDoc.data();
    
    const batch = adminDb.batch();
    
    // 1. Create/update the public shop document
    batch.set(publicShopRef, { ...shopData, status: 'approved', updatedAt: Timestamp.now() });
    
    // 2. Update the member's shop status
    batch.update(memberShopRef, { status: 'approved', updatedAt: Timestamp.now() });
    
    await batch.commit();
    
    return NextResponse.json({ success: true, message: 'Shop approved successfully.' });

  } catch (error: any) {
    console.error(`Error in approveShop for shop "${shopId}":`, error);
    if (error.code === 'auth/id-token-expired') {
       return NextResponse.json({ success: false, error: 'Authentication token has expired.' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
