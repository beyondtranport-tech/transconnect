
import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// IMPORTANT: Do not leak service account credentials to the client-side.
// This is a server-side only file.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

const adminEmail = 'beyondtransport@gmail.com';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export async function POST(request: Request) {
  try {
    // Check if the service account is configured
    if (!serviceAccount) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
    }

    const auth = getAuth();
    
    // Get user by email to find their UID
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(adminEmail);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json({ message: `User ${adminEmail} does not exist. It may have been deleted already.` }, { status: 200 });
      }
      throw error; // Re-throw other errors
    }
    
    // Delete the user
    await auth.deleteUser(userRecord.uid);
    
    return NextResponse.json({ message: `Successfully deleted user: ${adminEmail}` }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to delete admin user:', error);
    return NextResponse.json({ error: error.message || 'An unknown server error occurred.' }, { status: 500 });
  }
}
