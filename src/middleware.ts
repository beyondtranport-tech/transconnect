import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('__session')?.value;
  const secureAccessCookie = request.cookies.get('secure-backend-access')?.value;

  // Protect the main /backend route
  if (pathname.startsWith('/backend') && !pathname.startsWith('/backend/login')) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/signin?error=unauthorized', request.url));
    }
    // The session cookie's validity in terms of being the correct admin
    // will be checked on the client-side components. The middleware's job
    // is just to ensure a session exists.
  }

  // Protect the /backend/secure route
  if (pathname.startsWith('/backend/secure')) {
    if (secureAccessCookie !== 'true') {
      return NextResponse.redirect(new URL('/backend/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Match all backend routes except the login page for the secure area
  matcher: ['/backend/:path*'],
};
