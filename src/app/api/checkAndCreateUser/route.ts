
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

  const authorization = req.headers.get('authorization');
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
    
    const firebaseUser = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name,
        phoneNumber: decodedToken.phone_number,
    };
    
    if (!firebaseUser.email) {
        throw new Error("Token did not contain an email address.");
    }
    
    const db = getFirestore(app);
    const userDocRef = db.collection('users').doc(firebaseUser.uid);
    const userDocSnap = await userDocRef.get();
    const userData = userDocSnap.data();

    // If user document exists AND it has a companyId, there's nothing to do.
    if (userDocSnap.exists && userData?.companyId) {
        return NextResponse.json({ success: true, message: 'User document already exists and is complete.' });
    }

    const batch = db.batch();

    // Priority 1: Check for a pending partner invitation.
    const partnerQuery = db.collection('partners').where('email', '==', firebaseUser.email).where('invitationStatus', '==', 'invited').limit(1);
    const partnerSnap = await partnerQuery.get();

    if (!partnerSnap.empty) {
        console.log(`Found pending partner invitation for ${firebaseUser.email}. Processing as partner.`);
        const partnerDoc = partnerSnap.docs[0];
        
        batch.update(partnerDoc.ref, { 
            invitationStatus: 'registered',
            updatedAt: FieldValue.serverTimestamp(),
        });

        // Use set with merge to create or update the user document as a partner
        const partnerData = partnerDoc.data();
        const displayName = firebaseUser.displayName || `${partnerData.firstName} ${partnerData.lastName}`;
        const nameParts = displayName.split(' ');
        const userAsPartnerData = {
            id: firebaseUser.uid,
            firstName: partnerData.firstName || nameParts[0] || 'Partner',
            lastName: partnerData.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''),
            email: firebaseUser.email,
            phone: firebaseUser.phoneNumber || '',
            companyId: null, // Partners do not have a companyId.
            role: 'partner',
            updatedAt: FieldValue.serverTimestamp(),
        };
        if (!userDocSnap.exists) {
            (userAsPartnerData as any).createdAt = FieldValue.serverTimestamp();
        }
        batch.set(userDocRef, userAsPartnerData, { merge: true });
        
        await batch.commit();
        return NextResponse.json({ success: true, message: 'Partner account processed successfully.' });
    }

    // Priority 2: Check for a pending staff invitation.
    const staffQuery = db.collectionGroup('staff').where('email', '==', firebaseUser.email).where('status', '==', 'unconfirmed').limit(1);
    const staffSnap = await staffQuery.get();

    if (!staffSnap.empty) {
        console.log(`Found pending staff invitation for ${firebaseUser.email}. Processing as staff.`);
        const invitedStaffDoc = staffSnap.docs[0];
        const invitedStaffData = invitedStaffDoc.data();
        const companyId = invitedStaffData.companyId;
        
        // Use set with merge to create or update the user doc as staff
        const userAsStaffData = {
            id: firebaseUser.uid,
            firstName: invitedStaffData.firstName,
            lastName: invitedStaffData.lastName,
            email: firebaseUser.email,
            phone: firebaseUser.phoneNumber || '',
            companyId: companyId,
            role: 'staff',
            updatedAt: FieldValue.serverTimestamp(),
        };
        if (!userDocSnap.exists) {
            (userAsStaffData as any).createdAt = FieldValue.serverTimestamp();
        }
        batch.set(userDocRef, userAsStaffData, { merge: true });
        
        // Re-create the staff document using the UID as the key and confirm them.
        const newStaffDocRef = db.collection(`companies/${companyId}/staff`).doc(firebaseUser.uid);
        batch.set(newStaffDocRef, { ...invitedStaffData, id: firebaseUser.uid, status: 'confirmed' });
        batch.delete(invitedStaffDoc.ref); // Delete the original invite document.

        await batch.commit();
        return NextResponse.json({ success: true, message: 'Staff account processed successfully.' });
    }
    
    // --- Standard new user or INCOMPLETE user registration ---
    console.log(`Processing standard/incomplete user registration for ${firebaseUser.email}.`);
    
    const leadQuery = db.collectionGroup('leads').where('email', '==', firebaseUser.email).limit(1);
    const leadSnap = await leadQuery.get();
    if (!leadSnap.empty) {
        const leadDoc = leadSnap.docs[0];
        batch.update(leadDoc.ref, { status: 'registered' });
        if (!referrerId && leadDoc.data().companyId) {
            referrerId = leadDoc.data().companyId;
        }
    }

    // Create the company document. This is safe because we already checked if the user has one.
    const companyRef = db.collection('companies').doc();
    const displayName = firebaseUser.displayName?.trim();
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

    // Prepare user data, preserving existing fields if the user doc already exists.
    const nameParts = (firebaseUser.displayName || '').split(' ');
    
    const newUserData = {
        id: firebaseUser.uid,
        firstName: userData?.firstName || nameParts[0] || 'New',
        lastName: userData?.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User'),
        email: firebaseUser.email,
        phone: userData?.phone || firebaseUser.phoneNumber || '',
        companyId: companyRef.id, // This is the crucial link.
        role: 'owner',
        updatedAt: FieldValue.serverTimestamp(),
    };
    
    // Add createdAt and award points only if it's a completely new user.
    if (!userDocSnap.exists) {
        (newUserData as any).createdAt = FieldValue.serverTimestamp();
        
        const loyaltyConfigDoc = await db.collection('configuration').doc('loyaltySettings').get();
        const signupPoints = loyaltyConfigDoc.data()?.userSignupPoints || 50;
        newCompanyData.rewardPoints = signupPoints;
        
        if (referrerId) {
            const partnerReferralPoints = loyaltyConfigDoc.data()?.partnerReferralPoints || 200;
            const referrerCompanyRef = db.collection('companies').doc(referrerId);
            batch.update(referrerCompanyRef, { rewardPoints: FieldValue.increment(partnerReferralPoints) });
        }
    }
    
    // Set the company data in the batch
    batch.set(companyRef, newCompanyData);
    
    // This single command handles both creation of a new user doc and updating an incomplete one.
    batch.set(userDocRef, newUserData, { merge: true });
    
    await batch.commit();

    console.log(`Successfully processed user and company for ${firebaseUser.email}.`);
    return NextResponse.json({ success: true, message: 'User account processed successfully.' });

  } catch (error: any) {
    const uidFromToken = idToken ? await getAuth(app).verifyIdToken(idToken).then(t=>t.uid).catch(()=>'unknown') : 'unknown';
    console.error(`Error in checkAndCreateUser for user ${uidFromToken}:`, error);
    if (error.code?.startsWith('auth/')) {
       return NextResponse.json({ success: false, error: `Authentication error: ${error.message}` }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
