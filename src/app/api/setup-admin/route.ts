
import { NextResponse } from 'next/server';
import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

// Ensure the admin app is initialized only once.
const adminApp: App =
  getApps().find((app) => app.name === 'admin') ||
  initializeApp(
    {
      // projectId is read from GOOGLE_CLOUD_PROJECT env var
    },
    'admin'
  );

const adminAuth = getAuth(adminApp);
const adminFirestore = getFirestore(adminApp);

const ADMIN_EMAIL = 'beyondtransport@gmail.com';
const ADMIN_PASSWORD = 'TransConnectAdmin2024';

export async function POST() {
  try {
    let userRecord;
    // Check if user already exists
    try {
      userRecord = await adminAuth.getUserByEmail(ADMIN_EMAIL);
      // If user exists, update their password and claims
      await adminAuth.updateUser(userRecord.uid, {
        password: ADMIN_PASSWORD,
        emailVerified: true,
      });
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // User doesn't exist, create them
        userRecord = await adminAuth.createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          emailVerified: true,
          displayName: 'Super Admin',
        });
      } else {
        // Another error occurred
        throw error;
      }
    }

    // Set custom claims
    await adminAuth.setCustomUserClaims(userRecord.uid, { admin: true });

    // Create or update user profile in Firestore
    const memberDocRef = adminFirestore.collection('members').doc(userRecord.uid);
    await memberDocRef.set({
        id: userRecord.uid,
        email: ADMIN_EMAIL,
        firstName: "Super",
        lastName: "Admin",
        companyName: "TransConnect",
        phone: "N/A",
        membershipId: 'premium',
        rewardPoints: 9999,
        admin: true, // Explicitly set admin flag
    }, { merge: true });

    return NextResponse.json({ message: `Admin user ${ADMIN_EMAIL} created/updated successfully.` });
  } catch (error: any) {
    console.error('Admin setup failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
