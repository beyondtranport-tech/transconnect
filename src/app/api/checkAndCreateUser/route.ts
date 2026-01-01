
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAuth, UserRecord } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  const { app, error: initError } = getAdminApp();
  if (initError || !app) {
    return NextResponse.json({ success: false, error: 'Internal Server Error: Could not connect to Firebase.' }, { status: 500 });
  }

  const authorization = headers().get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'Unauthorized: No token provided.' }, { status: 401 });
  }

  const idToken = authorization.split('Bearer ')[1];
  
  try {
    const adminAuth = getAuth(app);
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const user: UserRecord = await adminAuth.getUser(decodedToken.uid);
    
    const db = getFirestore(app);
    const docRef = db.collection('members').doc(user.uid);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
        // Document already exists, everything is fine.
        return NextResponse.json({ success: true, message: 'User document already exists.' });
    }

    // --- Document does NOT exist, so create it ---
    const isAdmin = user.email === 'beyondtransport@gmail.com';
    const [firstName, lastName] = user.displayName?.split(' ') || ['New', 'User'];

    const memberData: any = {
        id: user.uid,
        ownerId: user.uid,
        firstName,
        lastName,
        email: user.email,
        phone: user.phoneNumber || 'Not provided',
        companyName: 'Not provided',
        membershipId: 'free',
        rewardPoints: 0,
        walletBalance: 0,
        admin: isAdmin,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };
    
    await docRef.set(memberData);

    return NextResponse.json({ success: true, message: 'User document created successfully.' });

  } catch (error: any) {
    console.error(`Error in checkAndCreateUser:`, error);
    if (error.code?.startsWith('auth/')) {
       return NextResponse.json({ success: false, error: `Authentication error: ${error.message}` }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
