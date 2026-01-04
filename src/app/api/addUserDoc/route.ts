
import { getFirestore, FieldValue, increment } from 'firebase-admin/firestore';
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

  const headersList = headers();
  const authorization = headersList.get('authorization');
  
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'Unauthorized: No token provided.' }, { status: 401 });
  }

  const idToken = authorization.split('Bearer ')[1];
  
  const { collectionPath, data } = await req.json();

  if (!collectionPath || !data) {
      return NextResponse.json({ success: false, error: 'Bad Request: "collectionPath" and "data" are required.' }, { status: 400 });
  }

  try {
    const adminAuth = getAuth(app);
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    const db = getFirestore(app);
    const pathSegments = collectionPath.split('/');
    
    // Security Check: Ensure the user is adding to a subcollection of their own company document.
    const userDoc = await db.collection('users').doc(uid).get();
    const companyId = userDoc.data()?.companyId;

    if (!companyId || pathSegments.length < 2 || pathSegments[0] !== 'companies' || pathSegments[1] !== companyId) {
        return NextResponse.json({ success: false, error: 'Forbidden: You can only add data to your own company subcollections.' }, { status: 403 });
    }
    
    const isAddingProduct = collectionPath.endsWith('/products');

    const batch = db.batch();
    const collectionRef = db.collection(collectionPath);
    const deserializedData = deserializeData(data);
    const newDocRef = collectionRef.doc(); // Generate ref before using it
    
    batch.set(newDocRef, deserializedData);
    
    // If a product is being added, award points.
    if (isAddingProduct) {
        const loyaltyConfigDoc = await db.collection('configuration').doc('loyaltySettings').get();
        const productAddPoints = loyaltyConfigDoc.data()?.productAddPoints || 5; // Default to 5
        const companyRef = db.collection('companies').doc(companyId);
        batch.update(companyRef, { rewardPoints: FieldValue.increment(productAddPoints) });
    }

    await batch.commit();

    return NextResponse.json({ success: true, id: newDocRef.id, message: 'Document created successfully.' });

  } catch (error: any) {
    console.error(`Error in addUserDoc for path "${collectionPath}":`, error);
    if (error.code === 'auth/id-token-expired') {
       return NextResponse.json({ success: false, error: 'Authentication token has expired.' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
