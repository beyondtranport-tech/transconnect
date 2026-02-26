
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  // 1. Initialize Admin App
  const { app, error: initError } = getAdminApp();
  if (initError || !app) {
    console.error("Admin SDK init error in checkAndCreateUser:", initError);
    return NextResponse.json({ success: false, error: 'Internal Server Error: Could not connect to Firebase.' }, { status: 500 });
  }

  try {
    // 2. Authenticate the request from the client.
    const authorization = req.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: No token provided.' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const adminAuth = getAuth(app);
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    const { uid, email, name, phone_number } = decodedToken;
    const firebaseUser = { uid, email, displayName: name || '', phoneNumber: phone_number || '' };

    if (!firebaseUser.email) {
      throw new Error("Token did not contain an email address.");
    }
    
    // 3. Safely get referrerId from the request body.
    let referrerId: string | null = null;
    try {
      const body = await req.json();
      referrerId = body.referrerId;
    } catch (e) {
      // Body might be empty or invalid JSON, which is acceptable.
    }

    const db = getFirestore(app);
    const userDocRef = db.collection('users').doc(firebaseUser.uid);
    const userDocSnap = await userDocRef.get();

    // FAST PATH: If user document exists and has a companyId, they are already set up. Do nothing.
    if (userDocSnap.exists && userDocSnap.data()?.companyId) {
        // As a safeguard, ensure claim is set if they are a WCTA member
        if(userDocSnap.data()?.companyId && referrerId === 'WCTA') {
            const companyDoc = await db.collection('companies').doc(userDocSnap.data()?.companyId).get();
            if(companyDoc.data()?.referrerId === 'WCTA') {
                await adminAuth.setCustomUserClaims(uid, { wcta: true });
            }
        }
        return NextResponse.json({ success: true, message: 'User already configured.' });
    }
    
    // --- NEW SIMPLIFIED CREATION LOGIC ---

    // 1. Create the Company Document
    const companyRef = db.collection('companies').doc();
    const displayName = firebaseUser.displayName.trim();
    const companyName = displayName ? `${displayName}'s Company` : 'My Company';

    const newCompanyData: any = {
        id: companyRef.id,
        ownerId: firebaseUser.uid,
        companyName: companyName,
        membershipId: 'free',
        isBillable: false,
        walletBalance: 0,
        pendingBalance: 0,
        availableBalance: 0,
        loyaltyTier: 'bronze',
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };
    
    if (referrerId) {
        newCompanyData.referrerId = referrerId;
    }
    await companyRef.set(newCompanyData);

    // 2. Create the User Document
    const nameParts = (firebaseUser.displayName || '').split(' ');
    const newUserData = {
        id: firebaseUser.uid,
        firstName: userDocSnap.data()?.firstName || nameParts[0] || 'New',
        lastName: userDocSnap.data()?.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User'),
        email: firebaseUser.email,
        phone: userDocSnap.data()?.phone || firebaseUser.phoneNumber || '',
        companyId: companyRef.id, // Link the user to the new company
        role: 'owner',
        updatedAt: FieldValue.serverTimestamp(),
         ...( !userDocSnap.exists && { createdAt: FieldValue.serverTimestamp() } )
    };
    await userDocRef.set(newUserData, { merge: true });

    // 3. Set Custom Claim if it's a WCTA member AFTER creation is successful.
    if (referrerId === 'WCTA') {
        await adminAuth.setCustomUserClaims(uid, { wcta: true });
    }

    return NextResponse.json({ success: true, message: 'User account and company created successfully.' });

  } catch (error: any) {
    console.error(`CRITICAL ERROR in checkAndCreateUser:`, error);
    return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

