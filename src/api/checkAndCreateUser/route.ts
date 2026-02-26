
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
    
    const firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name || '',
      phoneNumber: decodedToken.phone_number || '',
    };

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
      console.log("No valid body for referrerId, proceeding without it.");
    }

    const db = getFirestore(app);
    const userDocRef = db.collection('users').doc(firebaseUser.uid);
    const userDocSnap = await userDocRef.get();

    // 4. FAST PATH: If user document exists and has a companyId, they are already set up. Do nothing.
    if (userDocSnap.exists && userDocSnap.data()?.companyId) {
      return NextResponse.json({ success: true, message: 'User document already exists and is complete.' });
    }
    
    // 5. CORE LOGIC: Create the user and company documents in a single, reliable transaction.
    const batch = db.batch();
    
    // Create a new company document reference.
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
    
    // Add referrerId if it was passed from the client (e.g., for WCTA).
    if (referrerId) {
        newCompanyData.referrerId = referrerId;
    }
    batch.set(companyRef, newCompanyData);

    // Prepare the user document data.
    const nameParts = (firebaseUser.displayName || '').split(' ');
    const newUserData = {
        id: firebaseUser.uid,
        firstName: userDocSnap.data()?.firstName || nameParts[0] || 'New',
        lastName: userDocSnap.data()?.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User'),
        email: firebaseUser.email,
        phone: userDocSnap.data()?.phone || firebaseUser.phoneNumber || '',
        companyId: companyRef.id, // Link the user to the new company
        role: 'owner',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };
    batch.set(userDocRef, newUserData, { merge: true });
    
    // Commit the transaction.
    await batch.commit();

    return NextResponse.json({ success: true, message: 'User account and company created successfully.' });

  } catch (error: any) {
    console.error(`CRITICAL ERROR in checkAndCreateUser:`, error);
    // Ensure a JSON response is always sent on failure.
    return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
