
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
    
    const firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name || '',
      phoneNumber: decodedToken.phone_number || '',
    };

    if (!firebaseUser.email) {
      throw new Error("Token did not contain an email address.");
    }
    
    let referrerId: string | null = null;
    try {
      const body = await req.json();
      referrerId = body.referrerId;
    } catch (e) {}

    const db = getFirestore(app);
    const userDocRef = db.collection('users').doc(firebaseUser.uid);
    const userDocSnap = await userDocRef.get();

    if (userDocSnap.exists && userDocSnap.data()?.companyId) {
      return NextResponse.json({ success: true, message: 'User document already exists.' });
    }
    
    // --- LEAD CONVERSION BRIDGE ---
    // Search leads by email to attribute this registration
    const leadsSnap = await db.collection('leads')
        .where('email', '==', firebaseUser.email.toLowerCase())
        .limit(1)
        .get();
        
    let leadData = null;
    if (!leadsSnap.empty) {
        leadData = leadsSnap.docs[0].data();
        // Close the loop: Mark lead as active member immediately
        await leadsSnap.docs[0].ref.update({
            status: 'active',
            convertedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        });
    }

    const batch = db.batch();
    const companyRef = db.collection('companies').doc();
    
    const displayName = firebaseUser.displayName.trim();
    // Use AI-researched name from lead if available, otherwise fallback
    const companyName = leadData?.companyName || (displayName ? `${displayName}'s Company` : 'My Company');

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
        status: 'active', // Active immediately upon sign-up
        leadId: leadData?.id || null, // Create the hard-link for success tracking
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };
    
    if (referrerId) {
        newCompanyData.referrerId = referrerId;
    }

    const nameParts = (firebaseUser.displayName || '').split(' ');
    const newUserData = {
        id: firebaseUser.uid,
        firstName: leadData?.firstName || userDocSnap.data()?.firstName || nameParts[0] || 'New',
        lastName: leadData?.lastName || userDocSnap.data()?.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User'),
        email: firebaseUser.email,
        phone: leadData?.phone || userDocSnap.data()?.phone || firebaseUser.phoneNumber || '',
        companyId: companyRef.id,
        role: 'owner',
        updatedAt: FieldValue.serverTimestamp(),
    };
    
    if (!userDocSnap.exists) {
        (newUserData as any).createdAt = FieldValue.serverTimestamp();
        try {
            const loyaltyConfigDoc = await db.collection('configuration').doc('loyaltySettings').get();
            const signupPoints = loyaltyConfigDoc.data()?.userSignupPoints || 50;
            newCompanyData.rewardPoints = signupPoints;
            
            if (referrerId) {
                const partnerReferralPoints = loyaltyConfigDoc.data()?.partnerReferralPoints || 200;
                const referrerCompanyRef = db.collection('companies').doc(referrerId);
                batch.set(referrerCompanyRef, { rewardPoints: FieldValue.increment(partnerReferralPoints) }, { merge: true });
            }
        } catch (pointError) {
            console.warn("Could not award sign-up points:", pointError);
        }
    }
    
    batch.set(companyRef, newCompanyData);
    batch.set(userDocRef, newUserData, { merge: true });
    
    await batch.commit();

    return NextResponse.json({ success: true, message: 'User and Company records created and activated.' });

  } catch (error: any) {
    console.error(`Error in checkAndCreateUser:`, error);
    return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
