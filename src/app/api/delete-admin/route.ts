
import { NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const adminEmail = 'beyondtransport@gmail.com';

function initializeAdminApp(): App {
  const apps = getApps();
  const existingApp = apps.find(app => app.name === 'admin-delete');
  if (existingApp) {
    return existingApp;
  }
  // Initialize without explicit credentials.
  // This relies on the environment to provide the necessary configuration.
  return initializeApp({}, 'admin-delete');
}

export async function POST(request: Request) {
  try {
    const adminApp = initializeAdminApp();
    const auth = getAuth(adminApp);
    
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(adminEmail);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json({ message: `User ${adminEmail} does not exist. It may have been deleted already.` }, { status: 200 });
      }
      throw error; // Re-throw other errors
    }
    
    await auth.deleteUser(userRecord.uid);
    
    return NextResponse.json({ message: `Successfully deleted user: ${adminEmail}` }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to delete admin user:', error);
    // Provide a more specific error message if available
    const errorMessage = error.message || 'An unknown server error occurred.';
    return NextResponse.json({ error: `Failed to delete admin user: ${errorMessage}` }, { status: 500 });
  }
}
