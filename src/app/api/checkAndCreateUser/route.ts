
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
    
    // Use decodedToken directly to avoid extra API call that might cause permission issues.
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

    if (userDocSnap.exists) {
        return NextResponse.json({ success: true, message: 'User document already exists.' });
    }

    const batch = db.batch();
    const loyaltyConfigDoc = await db.collection('configuration').doc('loyaltySettings').get();

    // Check for partner invitation FIRST
    const partnerQuery = db.collection('partners').where('email', '==', firebaseUser.email).limit(1);
    const partnerSnap = await partnerQuery.get();
    if (!partnerSnap.empty) {
        console.log(`Found pending partner invitation for email: ${firebaseUser.email}`);
        const partnerDoc = partnerSnap.docs[0];
        const partnerData = partnerDoc.data();
        
        batch.update(partnerDoc.ref, { invitationStatus: 'registered' });

        const displayName = firebaseUser.displayName || `${partnerData.firstName} ${partnerData.lastName}`;
        const nameParts = displayName.split(' ');
        
        batch.set(userDocRef, {
            id: firebaseUser.uid,
            firstName: partnerData.firstName || nameParts[0] || 'Partner',
            lastName: partnerData.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User'),
            email: firebaseUser.email,
            phone: firebaseUser.phoneNumber || '',
            companyId: null,
            role: 'partner',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
        
    } else {
        // Not a partner, so check for a staff invitation
        const staffQuery = db.collectionGroup('staff').where('email', '==', firebaseUser.email).limit(1);
        const staffSnap = await staffQuery.get();

        if (!staffSnap.empty) {
            console.log(`Found pending staff invitation for email: ${firebaseUser.email}`);
            const invitedStaffDoc = staffSnap.docs[0];
            const invitedStaffData = invitedStaffDoc.data();
            const companyId = invitedStaffData.companyId;

            batch.set(userDocRef, {
                id: firebaseUser.uid,
                firstName: invitedStaffData.firstName,
                lastName: invitedStaffData.lastName,
                email: firebaseUser.email,
                phone: firebaseUser.phoneNumber || '',
                companyId: companyId,
                role: 'staff',
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            });
            
            // Re-create the staff document using the UID as the key for permissioning and update status
            const newStaffDocRef = db.collection(`companies/${companyId}/staff`).doc(firebaseUser.uid);
            batch.set(newStaffDocRef, { ...invitedStaffData, id: firebaseUser.uid, status: 'confirmed' });
            batch.delete(invitedStaffDoc.ref);
            
        } else {
            // Check for a lead invitation before standard signup
            const leadQuery = db.collectionGroup('leads').where('email', '==', firebaseUser.email).limit(1);
            const leadSnap = await leadQuery.get();
            if (!leadSnap.empty) {
                console.log(`Found lead for email: ${firebaseUser.email}`);
                const leadDoc = leadSnap.docs[0];
                batch.update(leadDoc.ref, { status: 'registered' });
                // If the link didn't have a referrer, use the one from the lead.
                if (!referrerId) {
                    referrerId = leadDoc.data().companyId;
                }
            }

            // Handle Standard User/Company Registration
            console.log(`Creating standard user and company for ${firebaseUser.email}.`);
            
            const signupPoints = loyaltyConfigDoc.data()?.userSignupPoints || 50;

            const displayName = firebaseUser.displayName || '';
            const nameParts = displayName.split(' ');
            const firstName = nameParts[0] || 'New';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';

            const companyRef = db.collection('companies').doc();
            
            const newCompanyData: any = {
                id: companyRef.id,
                ownerId: firebaseUser.uid,
                companyName: firebaseUser.displayName ? `${firebaseUser.displayName}'s Company` : 'My Company',
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
                role: 'owner',
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
        }
    }
    
    await batch.commit();

    console.log(`Successfully processed registration for ${firebaseUser.email}.`);
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
