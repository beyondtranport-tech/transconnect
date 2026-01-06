

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

// Helper to convert Firestore Timestamps to JSON-serializable strings
function serializeTimestamps(docData: any): any {
    if (!docData) return docData;
    const newDocData: { [key: string]: any } = {};
    for (const key in docData) {
        const value = docData[key];
        if (value instanceof FieldValue) {
            // Cannot serialize FieldValue, so we represent it as a placeholder
            newDocData[key] = { _type: 'FieldValue', _methodName: (value as any)._methodName };
        } else if (value && typeof value.toDate === 'function') { // Check for Timestamp
            newDocData[key] = value.toDate().toISOString();
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            newDocData[key] = serializeTimestamps(value);
        } else {
            newDocData[key] = value;
        }
    }
    return newDocData;
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
    const { path } = await req.json();
    if (!path) {
        return NextResponse.json({ success: false, error: 'Bad Request: "path" is required.' }, { status: 400 });
    }
    
    const adminAuth = getAuth(app);
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const db = getFirestore(app);
    
    const docRef = db.doc(path);
    const pathSegments = path.split('/');
    const isAdmin = decodedToken.email === 'beyondtransport@gmail.com';
    
    let isAuthorized = false;

    // Authorization logic
    if (pathSegments[0] === 'users' && pathSegments[1] === uid) {
        isAuthorized = true;
    }
    else {
        const userDoc = await db.collection('users').doc(uid).get();
        const companyId = userDoc.data()?.companyId;

        if (companyId && pathSegments[0] === 'companies' && pathSegments[1] === companyId) {
            isAuthorized = true;
        }
    }

    if (!isAuthorized && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden: You can only delete your own data.' }, { status: 403 });
    }
    
    // Use a transaction to delete and log atomically
    await db.runTransaction(async (transaction) => {
        const docSnap = await transaction.get(docRef);
        if (!docSnap.exists) {
            throw new Error("Document to delete does not exist.");
        }
        const beforeData = docSnap.data();

        transaction.delete(docRef);
        
        const auditLogRef = db.collection('auditLogs').doc();
        transaction.set(auditLogRef, {
            collectionPath: pathSegments.slice(0, -1).join('/'),
            documentId: pathSegments[pathSegments.length - 1],
            userId: uid,
            action: 'delete',
            timestamp: FieldValue.serverTimestamp(),
            before: serializeTimestamps(beforeData),
            after: null
        });
    });


    return NextResponse.json({ success: true, message: 'Document deleted and audited successfully.' });

  } catch (error: any) {
    console.error(`Error in deleteUserDoc:`, error);
    if (error.code === 'auth/id-token-expired') {
       return NextResponse.json({ success: false, error: 'Authentication token has expired.' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

    