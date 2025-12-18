import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
let adminApp: App;
if (!getApps().length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
        if(Object.keys(serviceAccount).length > 0) {
            adminApp = initializeApp({
                credential: cert(serviceAccount)
            });
        } else {
             adminApp = initializeApp();
        }
    } catch (e) {
        console.error("Failed to initialize Firebase Admin SDK from service account. Falling back to default init.", e);
        adminApp = initializeApp();
    }
} else {
    adminApp = getApps()[0];
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect the main /backend route
  if (pathname.startsWith('/backend')) {
    const sessionCookie = request.cookies.get('__session')?.value;
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/signin?error=unauthorized', request.url));
    }

    try {
      const decodedToken = await getAuth(adminApp).verifySessionCookie(sessionCookie, true);
      if (decodedToken.email !== adminEmail) {
        return NextResponse.redirect(new URL('/signin?error=forbidden', request.url));
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/signin?error=session_expired', request.url));
    }
  }

  // Protect the new /backend/secure route
  if (pathname.startsWith('/backend/secure')) {
    const hasAccess = request.cookies.get('secure-backend-access')?.value === 'true';
    if (!hasAccess) {
      return NextResponse.redirect(new URL('/backend/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/backend/:path*'],
};
