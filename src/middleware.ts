
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// This forces the middleware to run on the Node.js runtime instead of the Edge runtime.
export const runtime = 'nodejs';

// To prevent re-initialization in hot-reload environments
if (!getApps().length) {
  try {
    initializeApp();
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
      const decodedIdToken = await getAuth().verifySessionCookie(sessionCookie, true);
      
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
  // Match all backend routes
  matcher: ['/backend/:path*'],
};
