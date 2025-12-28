
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

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

  try {
    const adminAuth = getAuth(app);
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const displayName = decodedToken.name || 'My';

    const db = getFirestore(app);
    const memberRef = db.collection('members').doc(uid);
    const shopCollectionRef = memberRef.collection('shops');
    
    const newShopRef = shopCollectionRef.doc(); // Auto-generate ID

    const newShopData = {
      ownerId: uid,
      status: 'draft',
      shopName: `${displayName}'s New Shop`,
      category: '',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      id: newShopRef.id,
    };
    
    // Use a batch to perform both writes atomically
    const batch = db.batch();
    
    batch.set(newShopRef, newShopData);
    // Use set with merge:true instead of update for robustness.
    // This will create the member document if it doesn't exist, or update it if it does.
    batch.set(memberRef, { shopId: newShopRef.id }, { merge: true });
    
    await batch.commit();

    return NextResponse.json({ success: true, shopId: newShopRef.id });

  } catch (error: any) {
    console.error('Error in createShop function:', error);
    if (error.code === 'auth/id-token-expired') {
       return NextResponse.json({ success: false, error: 'Authentication token has expired.' }, { status: 401 });
    }
     if (error.code === 'auth/argument-error') {
       return NextResponse.json({ success: false, error: 'Invalid authentication token format.' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
