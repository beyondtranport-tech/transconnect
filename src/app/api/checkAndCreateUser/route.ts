
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
    const userDocRef = db.collection('users').doc(user.uid);
    const userDocSnap = await userDocRef.get();

    if (userDocSnap.exists) {
        return NextResponse.json({ success: true, message: 'User document already exists.' });
    }

    // --- User document does NOT exist, so create user and company ---
    console.log(`Document for user ${user.uid} not found. Creating user and company.`);

    const displayName = user.displayName || '';
    const nameParts = displayName.split(' ');
    const firstName = nameParts[0] || 'New';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';
    
    const batch = db.batch();
    
    // 1. Create Company Document
    const companyDocRef = db.collection('companies').doc();
    const companyData = {
        id: companyDocRef.id,
        ownerId: user.uid,
        companyName: user.displayName ? `${user.displayName}'s Company` : 'My Company',
        membershipId: 'free',
        rewardPoints: 0,
        walletBalance: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };
    batch.set(companyDocRef, companyData);

    // 2. Create User Document
    const userData = {
        id: user.uid,
        firstName,
        lastName,
        email: user.email,
        phone: user.phoneNumber || '',
        companyId: companyDocRef.id,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };
    batch.set(userDocRef, userData);

    await batch.commit();
    console.log(`Successfully created user ${user.uid} and company ${companyDocRef.id}.`);

    return NextResponse.json({ success: true, message: 'User and company documents created successfully.' });

  } catch (error: any) {
    console.error(`Error in checkAndCreateUser for user ${idToken ? getAuth(app).verifyIdToken(idToken).then(t=>t.uid).catch(()=>'unknown') : 'unknown'}:`, error);
    if (error.code?.startsWith('auth/')) {
       return NextResponse.json({ success: false, error: `Authentication error: ${error.message}` }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

    