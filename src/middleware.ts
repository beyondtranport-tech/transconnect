
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

  if (pathname.startsWith('/backend') && pathname !== '/backend/login') {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }

    try {
      const decodedToken = await getAuth(adminApp).verifySessionCookie(
        sessionCookie,
        true
      );

      if (decodedToken.email !== 'beyondtransport@gmail.com') {
        throw new Error('Unauthorized');
      }

      const adminPasswordCookie = request.cookies.get('admin-session')?.value;
      if (adminPasswordCookie !== process.env.SUPER_ADMIN_PASSWORD) {
         return NextResponse.redirect(new URL('/backend/login', request.url));
      }

      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }
  }

   if (pathname === '/backend/login') {
     const adminPasswordCookie = request.cookies.get('admin-session')?.value;
     if (adminPasswordCookie === process.env.SUPER_ADMIN_PASSWORD) {
        return NextResponse.redirect(new URL('/backend', request.url));
     }
  }


  return NextResponse.next();
}

export const config = {
  matcher: ['/backend/:path*', '/api/auth/session'],
};
