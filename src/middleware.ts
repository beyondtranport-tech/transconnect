
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { initializeApp, getApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

export const runtime = 'nodejs';

const adminApp =
  getApps().find((it) => it.name === 'admin') ||
  initializeApp(
    {
      credential:
        process.env.GOOGLE_APPLICATION_CREDENTIALS &&
        JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS),
    },
    'admin'
  );

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('__session')?.value;

  if (pathname.startsWith('/backend')) {
    if (!sessionCookie) {
      // If no session, redirect to the main sign-in page
      return NextResponse.redirect(new URL('/signin', request.url));
    }

    try {
      // Verify the session cookie to get the user's details
      const decodedToken = await getAuth(adminApp).verifySessionCookie(
        sessionCookie,
        true
      );

      // Check if the authenticated user is the super admin
      if (decodedToken.email !== 'beyondtransport@gmail.com') {
        // If not the admin, redirect them away from the backend
        return NextResponse.redirect(new URL('/', request.url));
      }

      // If the user is the admin, allow them to proceed
      return NextResponse.next();
    } catch (error) {
      // If cookie is invalid or expired, redirect to sign-in
      return NextResponse.redirect(new URL('/signin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/backend/:path*'],
};
