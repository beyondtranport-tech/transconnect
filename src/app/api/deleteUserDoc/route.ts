
import { getFirestore } from 'firebase-admin/firestore';
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
  
  const { path } = await req.json();

  if (!path) {
      return NextResponse.json({ success: false, error: 'Bad Request: "path" is required.' }, { status: 400 });
  }

  try {
    const adminAuth = getAuth(app);
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Security Check: Ensure the requested path belongs to the authenticated user.
    const pathSegments = path.split('/');
    if (pathSegments.length < 2 || pathSegments[0] !== 'members' || pathSegments[1] !== uid) {
        // Exception for admins deleting records
        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com';
        if (!isAdmin) {
          return NextResponse.json({ success: false, error: 'Forbidden: You can only delete your own data.' }, { status: 403 });
        }
    }

    const db = getFirestore(app);
    const docRef = db.doc(path);

    await docRef.delete();

    return NextResponse.json({ success: true, message: 'Document deleted successfully.' });

  } catch (error: any) {
    console.error(`Error in deleteUserDoc for path "${path}":`, error);
    if (error.code === 'auth/id-token-expired') {
       return NextResponse.json({ success: false, error: 'Authentication token has expired.' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
