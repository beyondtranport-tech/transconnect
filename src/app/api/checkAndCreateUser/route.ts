
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

  const headersList = headers();
  const authorization = headersList.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'Unauthorized: No token provided.' }, { status: 401 });
  }

  const idToken = authorization.split('Bearer ')[1];
  
  let referrerId: string | null = null;
  try {
      const body = await req.json();
      referrerId = body.referrerId;
  } catch (e) {
      // Body might be empty, which is fine.
  }

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

    const batch = db.batch();

    // Check if this email corresponds to a partner invitation
    const partnerQuery = db.collection('partners').where('email', '==', firebaseUser.email).limit(1);
    const partnerSnap = await partnerQuery.get();
    let isPartnerSignup = false;
    let partnerData: any = {};
    if (!partnerSnap.empty) {
        isPartnerSignup = true;
        const partnerDoc = partnerSnap.docs[0];
        partnerData = partnerDoc.data();
        batch.update(partnerDoc.ref, { invitationStatus: 'registered' });
        console.log(`Found partner invite for ${firebaseUser.email}. Flagging for registration.`);
    }

    // Check for pending staff invitation
    const staffQuery = db.collectionGroup('staff').where('email', '==', firebaseUser.email).limit(1);
    const staffSnap = await staffQuery.get();

    if (!staffSnap.empty) {
        console.log(`Found pending staff invitation for email: ${firebaseUser.email}`);
        const invitedStaffDoc = staffSnap.docs[0];
        const invitedStaffData = invitedStaffDoc.data();
        const companyId = invitedStaffData.companyId;

        // Create the new user document, linked to the correct company
        batch.set(userDocRef, {
            id: firebaseUser.uid,
            firstName: invitedStaffData.firstName,
            lastName: invitedStaffData.lastName,
            email: firebaseUser.email,
            phone: firebaseUser.phoneNumber || '',
            companyId: companyId,
            role: 'staff', // Assign the staff role
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
        
        // Delete the original invitation document
        batch.delete(invitedStaffDoc.ref);

        // Re-create the staff document using the UID as the key for permissioning
        const newStaffDocRef = db.collection(`companies/${companyId}/staff`).doc(firebaseUser.uid);
        batch.set(newStaffDocRef, { ...invitedStaffData, id: firebaseUser.uid });

        await batch.commit();
        
        console.log(`Successfully converted invitation for ${firebaseUser.email} to staff member of company ${companyId}.`);
        return NextResponse.json({ success: true, message: 'Staff member account created and linked to company.' });
    }

    // If not a staff member, proceed with standard user/company creation
    console.log(`Document for user ${firebaseUser.uid} not found. Creating user and company documents.`);
    
    const loyaltyConfigDoc = await db.collection('configuration').doc('loyaltySettings').get();
    const signupPoints = loyaltyConfigDoc.data()?.userSignupPoints || 50;

    const displayName = firebaseUser.displayName || (isPartnerSignup ? `${partnerData.firstName} ${partnerData.lastName}` : '');
    const nameParts = displayName.split(' ');
    const firstName = (isPartnerSignup ? partnerData.firstName : '') || nameParts[0] || 'New';
    const lastName = (isPartnerSignup ? partnerData.lastName : '') || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User');

    const companyRef = db.collection('companies').doc();
    
    const newCompanyData: any = {
        id: companyRef.id,
        ownerId: firebaseUser.uid,
        companyName: (isPartnerSignup ? partnerData.companyName : '') || (firebaseUser.displayName ? `${firebaseUser.displayName}'s Company` : 'My Company'),
        membershipId: 'free',
        rewardPoints: signupPoints,
        walletBalance: 0,
        loyaltyTier: 'bronze',
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };
    
    if (referrerId) {
        newCompanyData.referrerId = referrerId;
    }

    const newUserData = {
        id: firebaseUser.uid,
        firstName,
        lastName,
        email: firebaseUser.email,
        phone: firebaseUser.phoneNumber || '',
        companyId: companyRef.id,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };
    
    batch.set(companyRef, newCompanyData);
    batch.set(userDocRef, newUserData);

    if (referrerId) {
        const partnerReferralPoints = loyaltyConfigDoc.data()?.partnerReferralPoints || 200;
        const referrerCompanyRef = db.collection('companies').doc(referrerId);
        batch.update(referrerCompanyRef, { rewardPoints: FieldValue.increment(partnerReferralPoints) });
    }

    await batch.commit();

    console.log(`Successfully created user ${firebaseUser.uid} and company ${companyRef.id}.`);

    return NextResponse.json({ success: true, message: 'User and company documents created successfully.' });

  } catch (error: any) {
    const uidFromToken = idToken ? await getAuth(app).verifyIdToken(idToken).then(t=>t.uid).catch(()=>'unknown') : 'unknown';
    console.error(`Error in checkAndCreateUser for user ${uidFromToken}:`, error);
    if (error.code?.startsWith('auth/')) {
       return NextResponse.json({ success: false, error: `Authentication error: ${error.message}` }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
