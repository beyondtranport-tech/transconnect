
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAuth, UserRecord } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  const { app, error: initError } = getAdminApp();
  if (initError || !app) {
    console.error("Admin SDK init error in checkAndCreateUser:", initError);
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
    const memberDocRef = db.collection('members').doc(user.uid);
    const memberDocSnap = await memberDocRef.get();

    if (memberDocSnap.exists) {
        return NextResponse.json({ success: true, message: 'Member document already exists.' });
    }

    // --- Member document does NOT exist, so create it ---
    console.log(`Document for member ${user.uid} not found. Creating member document.`);

    const displayName = user.displayName || '';
    const nameParts = displayName.split(' ');
    const firstName = nameParts[0] || 'New';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';
    
    const newMemberData = {
        id: user.uid,
        firstName,
        lastName,
        email: user.email,
        phone: user.phoneNumber || '',
        companyName: user.displayName ? `${user.displayName}'s Company` : 'My Company',
        membershipId: 'free',
        rewardPoints: 0,
        walletBalance: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };

    await memberDocRef.set(newMemberData);

    console.log(`Successfully created member document for ${user.uid}.`);

    return NextResponse.json({ success: true, message: 'Member document created successfully.' });

  } catch (error: any) {
    console.error(`Error in checkAndCreateUser for user ${idToken ? getAuth(app).verifyIdToken(idToken).then(t=>t.uid).catch(()=>'unknown') : 'unknown'}:`, error);
    if (error.code?.startsWith('auth/')) {
       return NextResponse.json({ success: false, error: `Authentication error: ${error.message}` }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
