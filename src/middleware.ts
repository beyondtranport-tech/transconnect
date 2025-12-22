
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

export const runtime = 'nodejs';

const adminApp =
  getApps().find((app) => app.name === 'admin') ||
  initializeApp(
    {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    },
    'admin'
  );

const adminAuth = getAuth(adminApp);

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('__session')?.value;

  if (request.nextUrl.pathname.startsWith('/backend')) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }

    try {
      const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
      if (decodedToken.email !== 'beyondtransport@gmail.com') {
         // Not the admin user, redirect away.
        return NextResponse.redirect(new URL('/', request.url));
      }
      // User is the admin, allow access.
      return NextResponse.next();
    } catch (error) {
      // Invalid session cookie, redirect to login.
      return NextResponse.redirect(new URL('/signin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/backend/:path*'],
};
