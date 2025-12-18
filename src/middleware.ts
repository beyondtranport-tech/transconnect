import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
let adminApp: App;
if (!getApps().length) {
    try {
        // Try to initialize with service account from environment variables
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);
        adminApp = initializeApp({
            credential: cert(serviceAccount)
        });
    } catch (e) {
        console.error("Failed to initialize Firebase Admin SDK from service account. Falling back to default init.", e);
        // Fallback for environments where default initialization is expected to work
        adminApp = initializeApp();
    }
} else {
    adminApp = getApps()[0];
}

export async function middleware(request: NextRequest) {
  const adminUID = process.env.NEXT_PUBLIC_ADMIN_UID;
  
  if (request.nextUrl.pathname.startsWith('/backend')) {
    const sessionCookie = request.cookies.get('__session')?.value;

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/signin?error=unauthorized', request.url));
    }

    try {
      const decodedToken = await getAuth(adminApp).verifySessionCookie(sessionCookie, true);
      if (decodedToken.uid !== adminUID) {
        // Not the admin user, redirect
        return NextResponse.redirect(new URL('/signin?error=forbidden', request.url));
      }
      // This is the admin, allow access
      return NextResponse.next();
    } catch (error) {
      // Cookie is invalid or expired, redirect to signin
      return NextResponse.redirect(new URL('/signin?error=session_expired', request.url));
    }
  }

  return NextResponse.next();
}

// Ensure the middleware runs only for the backend route
export const config = {
  matcher: ['/backend/:path*'],
};
