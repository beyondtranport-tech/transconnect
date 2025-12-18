
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const secureAccessCookie = request.cookies.get('secure-backend-access')?.value;

  // If the user is trying to access any backend path...
  if (pathname.startsWith('/backend') && !pathname.startsWith('/backend/login')) {
    // ...and they don't have the access cookie...
    if (secureAccessCookie !== 'true') {
      // ...redirect them to the backend login page.
      return NextResponse.redirect(new URL('/backend/login', request.url));
    }
  }

  // If they are trying to access the login page but already have the cookie,
  // redirect them to the backend dashboard.
  if (pathname.startsWith('/backend/login') && secureAccessCookie === 'true') {
      return NextResponse.redirect(new URL('/backend', request.url));
  }


  return NextResponse.next();
}

export const config = {
  // Match all backend routes, including the login page itself.
  matcher: ['/backend/:path*'],
};
