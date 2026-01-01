
import { getFirestore } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

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
    const { path } = await req.json();
    if (!path) {
        return NextResponse.json({ success: false, error: 'Bad Request: "path" is required.' }, { status: 400 });
    }
    
    const adminAuth = getAuth(app);
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const db = getFirestore(app);
    
    const pathSegments = path.split('/');
    const isAdmin = decodedToken.email === 'beyondtransport@gmail.com';
    
    let isAuthorized = false;
    if (pathSegments[0] === 'users' && pathSegments[1] === uid) {
        isAuthorized = true;
    } else if (pathSegments[0] === 'companies') {
        const companyId = pathSegments[1];
        const companyDoc = await db.collection('companies').doc(companyId).get();
        if (companyDoc.exists && companyDoc.data()?.ownerId === uid) {
            isAuthorized = true;
        }
    }

    if (!isAuthorized && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden: You can only delete your own data.' }, { status: 403 });
    }

    await db.doc(path).delete();

    return NextResponse.json({ success: true, message: 'Document deleted successfully.' });

  } catch (error: any) {
    console.error(`Error in deleteUserDoc:`, error);
    if (error.code === 'auth/id-token-expired') {
       return NextResponse.json({ success: false, error: 'Authentication token has expired.' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
