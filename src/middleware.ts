
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getApps, initializeApp, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { credential } from 'firebase-admin';

// Helper function to initialize Firebase Admin SDK idempotently.
function initializeAdminApp() {
  if (getApps().length === 0) {
    try {
        initializeApp({
            credential: credential.applicationDefault(),
        });
    } catch(e) {
        console.error("Firebase Admin initialization failed:", e);
    }
  }
  return getApp();
}

/**
 * This middleware function is critical for securing the /backend routes.
 * It verifies the user's session cookie and ensures only authenticated administrators
 * can access the backend pages.
 *
 * Here's the logic:
 * 1. Initialize the Firebase Admin SDK.
 * 2. Get the session cookie from the incoming request.
 * 3. If there's no cookie, redirect to the sign-in page immediately.
 * 4. If there is a cookie, verify it using `auth().verifySessionCookie()`.
 * 5. If the cookie is valid, check if the user's email is 'transconnect@gmail.com'.
 * 6. If the user is the admin, allow the request to proceed.
 * 7. If the cookie is invalid or the user is not an admin, redirect to the sign-in page.
 */
export async function middleware(request: NextRequest) {
  try {
    initializeAdminApp();
    const auth = getAuth();

    const sessionCookie = request.cookies.get('__session')?.value;

    if (!sessionCookie) {
      console.log('Middleware: No session cookie, redirecting to signin.');
      return NextResponse.redirect(new URL('/signin', request.url));
    }

    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);

    if (decodedToken.email !== 'transconnect@gmail.com') {
      console.log('Middleware: User is not admin, redirecting to signin.');
      return NextResponse.redirect(new URL('/signin', request.url));
    }
    
    // If the user is the admin, allow the request to continue.
    return NextResponse.next();

  } catch (error) {
    console.error('Middleware Error:', error);
    // In case of any error (e.g., invalid cookie), redirect to signin.
    return NextResponse.redirect(new URL('/signin', request.url));
  }
}

export const config = {
  matcher: ['/backend/:path*'],
};
