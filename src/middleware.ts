import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('__session')?.value;
  const secureAccessCookie = request.cookies.get('secure-backend-access')?.value;

  // Protect the main /backend route for admin access.
  if (pathname.startsWith('/backend') && !pathname.startsWith('/backend/login')) {
     if (!sessionCookie) {
       // If there's no session cookie, redirect to sign-in.
       return NextResponse.redirect(new URL('/signin?error=unauthorized', request.url));
     }
     // The presence of the __session cookie is now the source of truth for admin access.
     // The API route is responsible for verifying it's a valid admin before setting the cookie.
  }
  
  // Protect the /backend/secure route with a separate password-based cookie.
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
