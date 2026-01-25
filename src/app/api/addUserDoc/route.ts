
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
    let isAuthorized = false;

    // Authorization logic
    if (pathSegments.length >= 2 && pathSegments[0] === 'members' && pathSegments[1] === uid) {
        isAuthorized = true;
    } else if (pathSegments.length >= 2 && pathSegments[0] === 'companies') {
        const companyId = pathSegments[1];
        const userDocSnap = await db.collection('users').doc(uid).get();
        if (userDocSnap.data()?.companyId === companyId) {
             isAuthorized = true;
        }
    }
    
    if (!isAuthorized) {
        return NextResponse.json({ success: false, error: 'Forbidden: You can only add documents to your own subcollections.' }, { status: 403 });
    }

    const batch = db.batch();
    const collectionRef = db.collection(collectionPath);
    const newDocRef = collectionRef.doc();
    const deserializedData = deserializeData(data);
    const finalData = { ...deserializedData, id: newDocRef.id };
    
    batch.set(newDocRef, finalData);
    
    // Check if a product is being added and award points if so
    if (collectionPath.endsWith('/products')) {
        const loyaltyConfigDoc = await db.collection('configuration').doc('loyaltySettings').get();
        const productAddPoints = loyaltyConfigDoc.data()?.productAddPoints || 5;
        const companyRef = db.doc(`companies/${pathSegments[1]}`);
        batch.update(companyRef, { rewardPoints: FieldValue.increment(productAddPoints) });
    }
    
    // Add audit log entry
    const auditLogRef = db.collection('auditLogs').doc();
    batch.set(auditLogRef, {
      collectionPath,
      documentId: newDocRef.id,
      userId: uid,
      companyId: pathSegments[1], // Assuming companyId is the second segment
      action: 'create',
      timestamp: FieldValue.serverTimestamp(),
      before: null,
      after: finalData
    });

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
