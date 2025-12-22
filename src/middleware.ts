
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { firebaseConfig } from '@/firebase/config';

// To prevent re-initialization in hot-reload environments
if (!global._firebaseAdminApp) {
  try {
    global._firebaseAdminApp = initializeApp({
        projectId: firebaseConfig.projectId,
    });
  } catch (error) {
    console.error("Firebase Admin initialization error in middleware:", error);
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('__session')?.value;

  // 1. If trying to access the backend
  if (pathname.startsWith('/backend')) {
    // If no session cookie, redirect to the main sign-in page
    if (!sessionCookie) {
      const url = request.nextUrl.clone();
      url.pathname = '/signin';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    try {
      // 2. Verify the session cookie
      const decodedIdToken = await getAuth(global._firebaseAdminApp).verifySessionCookie(sessionCookie, true);
      
      // 3. Check if the user is the designated admin
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      if (decodedIdToken.email !== adminEmail) {
        // Not the admin, redirect to the account page or an "unauthorized" page
        return NextResponse.redirect(new URL('/account', request.url));
      }
      
      // 4. User is the admin, allow access
      return NextResponse.next();

    } catch (error) {
      // Cookie is invalid or expired. Redirect to sign-in.
      const url = request.nextUrl.clone();
      url.pathname = '/signin';
      url.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(url);
      // Clear the invalid cookie
      response.cookies.delete('__session');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  // Match all backend routes, excluding the API route for creating the session
  matcher: ['/backend/:path*'],
};

// Extend the NodeJS.Global interface to include our custom property
declare global {
  // eslint-disable-next-line no-var
  var _firebaseAdminApp: any;
}
