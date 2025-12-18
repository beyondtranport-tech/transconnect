import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, App } from 'firebase-admin/app';

// This is a temporary solution to make sure the app is initialized.
// In a real-world scenario, you'd want to use a more robust solution.
let adminApp: App;
if (!getApps().length) {
    adminApp = initializeApp();
} else {
    adminApp = getApps()[0];
}


export async function middleware(request: NextRequest) {
  const adminUID = process.env.NEXT_PUBLIC_ADMIN_UID;
  
  if (request.nextUrl.pathname.startsWith('/backend')) {
    const sessionCookie = request.cookies.get('__session' as any)?.value;

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/signin?error=unauthorized', request.url));
    }

    try {
      const decodedToken = await getAuth(adminApp).verifySessionCookie(sessionCookie, true);
      if (decodedToken.uid !== adminUID) {
        return NextResponse.redirect(new URL('/signin?error=unauthorized', request.url));
      }
      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL('/signin?error=unauthorized', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/backend/:path*'],
};
