
'use client';

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
    // 2. Authenticate the request
    const authorization = req.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: No token provided.' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const adminAuth = getAuth(app);
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    const firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name || '',
      phoneNumber: decodedToken.phone_number || '',
    };

    if (!firebaseUser.email) {
      throw new Error("Token did not contain an email address.");
    }
    
    // 3. Get referrerId from request body if it exists
    let referrerId: string | null = null;
    try {
      const body = await req.json();
      referrerId = body.referrerId;
    } catch (e) {
      // Body might be empty, which is fine for sign-in flows.
    }

    const db = getFirestore(app);
    const userDocRef = db.collection('users').doc(firebaseUser.uid);
    const userDocSnap = await userDocRef.get();

    // 4. If user is already set up, do nothing.
    if (userDocSnap.exists && userDocSnap.data()?.companyId) {
      return NextResponse.json({ success: true, message: 'User document already exists and is complete.' });
    }
    
    // 5. SIMPLIFIED user creation logic.
    // This is a fast, reliable path for all new registrations.
    const batch = db.batch();
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

    const nameParts = (firebaseUser.displayName || '').split(' ');
    const newUserData = {
        id: firebaseUser.uid,
        firstName: userDocSnap.data()?.firstName || nameParts[0] || 'New',
        lastName: userDocSnap.data()?.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User'),
        email: firebaseUser.email,
        phone: userDocSnap.data()?.phone || firebaseUser.phoneNumber || '',
        companyId: companyRef.id,
        role: 'owner',
        updatedAt: FieldValue.serverTimestamp(),
    };
    
    if (!userDocSnap.exists) {
        (newUserData as any).createdAt = FieldValue.serverTimestamp();
    }
    
    batch.set(companyRef, newCompanyData);
    batch.set(userDocRef, newUserData, { merge: true });
    
    await batch.commit();

    return NextResponse.json({ success: true, message: 'User account created/updated successfully.' });

  } catch (error: any) {
    console.error(`Error in checkAndCreateUser:`, error);
    // Ensure a JSON response is always sent
    return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
