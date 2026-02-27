
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  const { app, error: initError } = getAdminApp();
  if (initError || !app) {
    console.error("CRITICAL: Admin SDK init error in checkAndCreateUser:", initError);
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
    
    const { uid, email, name, phone_number } = decodedToken;

    if (!email) {
      throw new Error("Token did not contain an email address.");
    }
    
    let referrerId: string | null = null;
    try {
      const body = await req.json();
      referrerId = body.referrerId;
    } catch (e) {
      // Body might be empty, which is fine.
    }

    const db = getFirestore(app);
    const userDocRef = db.collection('users').doc(uid);
    const userDocSnap = await userDocRef.get();

    // Fast path: If user is already fully set up, do nothing.
    if (userDocSnap.exists && userDocSnap.data()?.companyId) {
      return NextResponse.json({ success: true, message: 'User already set up.' });
    }
    
    // --- This is the new, robust creation path ---
    const batch = db.batch();
    
    // 1. Prepare Company Document
    const companyRef = db.collection('companies').doc();
    const companyId = companyRef.id;
    const companyName = name?.trim() ? `${name.trim()}'s Company` : 'My Company';
    
    const newCompanyData: any = {
        id: companyId,
        ownerId: uid,
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
        rewardPoints: 50, // Default points
    };
    if (referrerId === 'WCTA') {
        newCompanyData.referrerId = 'WCTA';
    }
    batch.set(companyRef, newCompanyData);

    // 2. Prepare User Document
    const nameParts = (name || '').split(' ').filter(Boolean);
    const newUserData = {
        id: uid,
        firstName: nameParts[0] || 'New',
        lastName: nameParts.slice(1).join(' ') || 'User',
        email: email,
        phone: phone_number || '',
        companyId: companyId,
        role: 'owner',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };
    batch.set(userDocRef, newUserData, { merge: true }); // Merge in case a partial user doc exists
    
    // 3. Commit atomically
    await batch.commit();

    // 4. Set custom claim for instant access (best-effort after successful write)
    if (referrerId === 'WCTA') {
        try {
            await adminAuth.setCustomUserClaims(uid, { wcta: true });
        } catch (claimError) {
            // Log this, but don't fail the entire request because the database is correct.
            console.warn(`Failed to set WCTA custom claim for user ${uid}:`, claimError);
        }
    }

    return NextResponse.json({ success: true, message: 'User account created successfully.' });

  } catch (error: any) {
    console.error(`CRITICAL ERROR in checkAndCreateUser:`, error);
    // Always return a valid JSON response, even on crashes.
    return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
