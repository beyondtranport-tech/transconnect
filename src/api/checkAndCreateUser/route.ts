
'use server';

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  const { app, error: initError } = getAdminApp();
  if (initError || !app) {
    console.error("Admin SDK init error in checkAndCreateUser:", initError);
    return NextResponse.json({ success: false, error: 'Internal Server Error: Could not connect to Firebase.' }, { status: 500 });
  }

  try {
    const authorization = req.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: No token provided.' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    
    const adminAuth = getAuth(app);
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    const { uid, email, name } = decodedToken;
    const db = getFirestore(app);

    const userDocRef = db.collection('users').doc(uid);
    const userDocSnap = await userDocRef.get();

    // If user is already fully set up, we are done.
    if (userDocSnap.exists && userDocSnap.data()?.companyId) {
      // Set WCTA claim for existing users if they are WCTA members
      if (userDocSnap.data()?.companyData?.referrerId === 'WCTA' && !decodedToken.wcta) {
          await adminAuth.setCustomUserClaims(uid, { wcta: true });
      }
      return NextResponse.json({ success: true, message: 'User already setup.' });
    }
    
    const { referrerId } = await req.json().catch(() => ({ referrerId: null }));

    // Simple, sequential writes for maximum stability. No batch.
    const companyRef = db.collection('companies').doc();
    const companyId = companyRef.id;

    const displayName = name || '';
    const companyName = displayName.trim() ? `${displayName.trim()}'s Company` : 'My Company';
    
    const newCompanyData: any = {
      id: companyId,
      ownerId: uid,
      companyName,
      membershipId: 'free',
      isBillable: false,
      walletBalance: 0,
      pendingBalance: 0,
      availableBalance: 0,
      loyaltyTier: 'bronze',
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      rewardPoints: 50, // Default starting points
    };
    
    if (referrerId) {
      newCompanyData.referrerId = referrerId;
    }

    await companyRef.set(newCompanyData);

    const nameParts = displayName.split(' ').filter(Boolean);
    const newUserData = {
      id: uid,
      firstName: nameParts[0] || 'New',
      lastName: nameParts.slice(1).join(' ') || 'User',
      email: email,
      phone: decodedToken.phone_number || '',
      companyId: companyId,
      role: 'owner',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    
    await userDocRef.set(newUserData, { merge: true });

    // Set custom claim AFTER successful database writes.
    if (referrerId === 'WCTA') {
        await adminAuth.setCustomUserClaims(uid, { wcta: true });
    }

    return NextResponse.json({ success: true, message: 'User account created successfully.' });

  } catch (error: any) {
    console.error(`CRITICAL ERROR in checkAndCreateUser:`, error);
    return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
