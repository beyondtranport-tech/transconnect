
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
    const firebaseUser: UserRecord = await adminAuth.getUser(decodedToken.uid);
    
    const db = getFirestore(app);
    const userDocRef = db.collection('users').doc(firebaseUser.uid);
    const userDocSnap = await userDocRef.get();

    if (userDocSnap.exists) {
        return NextResponse.json({ success: true, message: 'User document already exists.' });
    }

    // --- User document does NOT exist, so create it and the associated company ---
    console.log(`Document for user ${firebaseUser.uid} not found. Creating user and company documents.`);

    const displayName = firebaseUser.displayName || '';
    const nameParts = displayName.split(' ');
    const firstName = nameParts[0] || 'New';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';

    // Create a new company document first
    const companyRef = db.collection('companies').doc();
    
    const newCompanyData = {
        id: companyRef.id,
        ownerId: firebaseUser.uid,
        companyName: firebaseUser.displayName ? `${firebaseUser.displayName}'s Company` : 'My Company',
        membershipId: 'free',
        rewardPoints: 0,
        walletBalance: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };

    // Create the new user document
    const newUserData = {
        id: firebaseUser.uid,
        firstName,
        lastName,
        email: firebaseUser.email,
        phone: firebaseUser.phoneNumber || '',
        companyId: companyRef.id, // Link to the new company
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };
    
    // Use a batch to write both documents atomically
    const batch = db.batch();
    batch.set(companyRef, newCompanyData);
    batch.set(userDocRef, newUserData);
    await batch.commit();

    console.log(`Successfully created user ${firebaseUser.uid} and company ${companyRef.id}.`);

    return NextResponse.json({ success: true, message: 'User and company documents created successfully.' });

  } catch (error: any) {
    console.error(`Error in checkAndCreateUser for user ${idToken ? getAuth(app).verifyIdToken(idToken).then(t=>t.uid).catch(()=>'unknown') : 'unknown'}:`, error);
    if (error.code?.startsWith('auth/')) {
       return NextResponse.json({ success: false, error: `Authentication error: ${error.message}` }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
