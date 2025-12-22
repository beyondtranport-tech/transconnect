import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// The email of the admin user to delete
const ADMIN_EMAIL = 'beyondtransport@gmail.com';

// Function to initialize Firebase Admin SDK
function initializeAdmin() {  
  if (admin.apps.length > 0) {
    return admin.app();
  }
  
  // No explicit credential, relies on the environment
  // (e.g., GOOGLE_APPLICATION_CREDENTIALS)
  return admin.initializeApp();
}

export async function POST(request: Request) {
  try {
    initializeAdmin();
    const auth = admin.auth();

    // Get the user by email
    const user = await auth.getUserByEmail(ADMIN_EMAIL);

    // Delete the user
    await auth.deleteUser(user.uid);

    return NextResponse.json({ message: `Successfully deleted user: ${ADMIN_EMAIL}` });

  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json({ message: `User ${ADMIN_EMAIL} does not exist. Safe to proceed.` });
    }
    console.error('Error deleting admin user:', error);
    return NextResponse.json({ message: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
