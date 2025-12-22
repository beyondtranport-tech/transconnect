
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { initializeApp, getApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

export const runtime = 'nodejs';

// Initialize Firebase Admin SDK
if (!getApps().some(app => app.name === 'admin')) {
  initializeApp(
    {
      credential:
        process.env.GOOGLE_APPLICATION_CREDENTIALS &&
        JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS),
    },
    'admin'
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  if (pathname.startsWith('/backend')) {
    const sessionCookie = request.cookies.get('__session')?.value;

    if (!sessionCookie) {
      // Redirect to the member sign-in page if there's no session cookie
      const url = request.nextUrl.clone();
      url.pathname = '/signin';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    try {
      // Verify the session cookie to get the user's details
      const decodedToken = await getAuth(getApp('admin')).verifySessionCookie(
        sessionCookie,
        true
      );
      
      // Check if the authenticated user is the designated super admin
      if (decodedToken.email !== 'beyondtransport@gmail.com') {
        // If not the admin, redirect them away from the backend to the homepage
        return NextResponse.redirect(new URL('/', request.url));
      }

      // If the user is the admin, allow them to proceed
      return NextResponse.next();
    } catch (error) {
      // If cookie is invalid or expired, redirect to sign-in
       const url = request.nextUrl.clone();
      url.pathname = '/signin';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/backend/:path*'],
};
