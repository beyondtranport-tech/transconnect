

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

// Helper function to deserialize special server values
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

// Helper to convert Firestore Timestamps to JSON-serializable strings for logging
function serializeTimestamps(docData: any): any {
    if (!docData) return docData;
    const newDocData: { [key: string]: any } = {};
    for (const key in docData) {
        const value = docData[key];
        if (value instanceof FieldValue) {
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
    const { path, data } = await req.json();
    if (!path || !data) {
        return NextResponse.json({ success: false, error: 'Bad Request: "path" and "data" are required.' }, { status: 400 });
    }

    const adminAuth = getAuth(app);
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const isAdmin = decodedToken.email === 'beyondtransport@gmail.com';
    
    const db = getFirestore(app);
    const docRef = db.doc(path);
    const pathSegments = path.split('/');
    
    // --- Authorization Logic ---
    let isAuthorized = false;

    if (isAdmin) {
        isAuthorized = true;
    } else {
        // User can update their own user doc
        if (pathSegments[0] === 'users' && pathSegments[1] === uid) {
            isAuthorized = true;
        }
        // User can update documents within their own /members/{uid} subcollections
        else if (pathSegments[0] === 'members' && pathSegments[1] === uid) {
            isAuthorized = true;
        }
        // User can update their own company doc
        else {
            const userDoc = await db.collection('users').doc(uid).get();
            const userCompanyId = userDoc.data()?.companyId;

            // Path is /companies/{companyId} or a subcollection
            if (userCompanyId && pathSegments[0] === 'companies' && pathSegments[1] === userCompanyId) {
                isAuthorized = true;
            }
        }
    }

    if (!isAuthorized) {
        return NextResponse.json({ success: false, error: 'Forbidden: You do not have permission to modify this resource.' }, { status: 403 });
    }
    // --- End Authorization ---

    const deserializedData = deserializeData(data);

    // Use a transaction to update the document and create an audit log entry atomically
    await db.runTransaction(async (transaction) => {
        const docSnap = await transaction.get(docRef);
        if (!docSnap.exists) {
            // If the document doesn't exist, we can't update it.
            // This is a valid case for "set with merge" but we will treat it as an error for updates.
            // For creating new docs, a different endpoint should be used.
            // Let's allow creation if data is being set, not just updated
            if (Object.keys(deserializedData).length > 0) {
                 transaction.set(docRef, deserializedData, { merge: true });
            } else {
                throw new Error("Document to update does not exist.");
            }
        } else {
             transaction.update(docRef, deserializedData);
        }
        
        const auditLogRef = db.collection('auditLogs').doc();
        transaction.set(auditLogRef, {
            collectionPath: pathSegments.slice(0, -1).join('/'),
            documentId: pathSegments[pathSegments.length - 1],
            userId: uid,
            action: 'update',
            timestamp: FieldValue.serverTimestamp(),
            // before: serializeTimestamps(beforeData),
            // after: serializeTimestamps({ ...beforeData, ...deserializedData }) // Merge for after state
        });
    });

    return NextResponse.json({ success: true, message: 'Document updated and audited successfully.' });

  } catch (error: any) {
    console.error(`Error in updateUserDoc:`, error);
    if (error.code === 'auth/id-token-expired') {
       return NextResponse.json({ success: false, error: 'Authentication token has expired.' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
