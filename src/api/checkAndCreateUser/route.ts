
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
    
    const { uid, email, name, phone_number } = decodedToken;

    if (!email) {
      throw new Error("Token did not contain an email address.");
    }
    
    // 3. Get referrerId from request body if it exists
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

    // 4. If user is already fully set up, ensure claim is set and exit.
    if (userDocSnap.exists && userDocSnap.data()?.companyId) {
        if (userDocSnap.data()?.companyData?.referrerId === 'WCTA' && !decodedToken.wcta) {
          await adminAuth.setCustomUserClaims(uid, { wcta: true });
        }
        return NextResponse.json({ success: true, message: 'User already set up.' });
    }
    
    // 5. Use a Firestore Batch for atomic write of new user and company.
    const batch = db.batch();
    const companyRef = db.collection('companies').doc();
    const companyId = companyRef.id;
    
    const displayName = name || '';
    const companyName = displayName.trim() ? `${displayName.trim()}'s Company` : 'My Company';

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
    
    if (referrerId) {
        newCompanyData.referrerId = referrerId;
    }
    
    batch.set(companyRef, newCompanyData);

    const nameParts = (displayName || '').split(' ').filter(Boolean);
    const newUserData = {
        id: uid,
        firstName: nameParts[0] || 'New',
        lastName: nameParts.slice(1).join(' ') || 'User',
        email: email,
        phone: phone_number || '',
        companyId: companyId,
        role: 'owner',
        updatedAt: FieldValue.serverTimestamp(),
    };
    
    if (!userDocSnap.exists) {
        (newUserData as any).createdAt = FieldValue.serverTimestamp();
    }
    
    batch.set(userDocRef, newUserData, { merge: true });
    
    // 6. Commit the atomic write.
    await batch.commit();

    // 7. Set custom claim *after* the database operations are successful.
    if (referrerId === 'WCTA') {
        await adminAuth.setCustomUserClaims(uid, { wcta: true });
    }

    return NextResponse.json({ success: true, message: 'User account created successfully.' });

  } catch (error: any) {
    console.error(`CRITICAL ERROR in checkAndCreateUser:`, error);
    // Always return a valid JSON response, even on errors.
    return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
