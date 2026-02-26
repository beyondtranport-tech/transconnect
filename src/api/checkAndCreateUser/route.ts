
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
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
    
    const { uid, email, name, phone_number } = decodedToken;
    const firebaseUser = { uid, email, displayName: name || '', phoneNumber: phone_number || '' };

    if (!firebaseUser.email) {
      throw new Error("Token did not contain an email address.");
    }
    
    let referrerId: string | null = null;
    try {
      const body = await req.json();
      referrerId = body.referrerId;
    } catch (e) {
      // Body might be empty, which is acceptable.
    }

    const db = getFirestore(app);
    const userDocRef = db.collection('users').doc(firebaseUser.uid);
    const companyCollectionRef = db.collection('companies');

    await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        // If the user document exists and already has a companyId, the user is fully set up.
        // We will just ensure their WCTA claim is set if applicable and then do nothing else.
        if (userDoc.exists && userDoc.data()?.companyId) {
             if (referrerId === 'WCTA') {
                const existingCompany = await transaction.get(companyCollectionRef.doc(userDoc.data()?.companyId));
                if (existingCompany.exists && existingCompany.data()?.referrerId === 'WCTA') {
                    // The custom claim might have been missed if a previous function failed.
                    // This ensures it gets set on subsequent logins.
                    await adminAuth.setCustomUserClaims(uid, { wcta: true });
                }
             }
            return;
        }

        // --- Create New Company and User atomically ---
        const companyRef = companyCollectionRef.doc();
        const companyId = companyRef.id;

        const displayName = firebaseUser.displayName.trim();
        const companyName = displayName ? `${displayName}'s Company` : 'My Company';

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
        };
        if (referrerId) {
            newCompanyData.referrerId = referrerId;
        }

        const nameParts = (firebaseUser.displayName || '').split(' ');
        const newUserData: any = {
            id: uid,
            firstName: nameParts[0] || 'New',
            lastName: nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User',
            email: firebaseUser.email,
            phone: firebaseUser.phoneNumber || '',
            companyId: companyId,
            role: 'owner',
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (!userDoc.exists) {
            newUserData.createdAt = FieldValue.serverTimestamp();
        }
        
        transaction.set(companyRef, newCompanyData);
        transaction.set(userDocRef, newUserData, { merge: true });
    });

    // This runs only after the transaction above successfully commits.
    if (referrerId === 'WCTA') {
        await adminAuth.setCustomUserClaims(uid, { wcta: true });
    }

    return NextResponse.json({ success: true, message: 'User account and company created successfully.' });

  } catch (error: any) {
    console.error(`CRITICAL ERROR in checkAndCreateUser:`, error);
    return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
