import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : null;

if (serviceAccount && !getApps().length) {
    initializeApp({
        credential: cert(serviceAccount)
    });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('__session')?.value;
  const secureAccessCookie = request.cookies.get('secure-backend-access')?.value;

  // Protect the main /backend route for admin access.
  if (pathname.startsWith('/backend') && !pathname.startsWith('/backend/login')) {
     if (!sessionCookie) {
       return NextResponse.redirect(new URL('/signin?error=unauthorized', request.url));
     }

     try {
        const decodedToken = await getAuth().verifySessionCookie(sessionCookie, true);
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
        if(decodedToken.email !== adminEmail) {
            throw new Error("Not an admin");
        }
     } catch (error) {
        return NextResponse.redirect(new URL('/signin?error=unauthorized', request.url));
     }
  }
  
  // Protect the /backend/secure route with a password.
  if (pathname.startsWith('/backend/secure')) {
    if (secureAccessCookie !== 'true') {
      return NextResponse.redirect(new URL('/backend/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Match all backend routes.
  matcher: ['/backend/:path*'],
};
