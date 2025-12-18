import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const adminToken = request.cookies.get('admin-auth-token');
  const { pathname } = request.nextUrl;

  // Protect the /backend route
  if (pathname.startsWith('/backend')) {
    // If there's no token or the token is invalid, redirect to sign-in page
    if (!adminToken || adminToken.value !== 'SUPER_SECRET_ADMIN_TOKEN_VALUE') {
      const url = request.nextUrl.clone();
      url.pathname = '/signin';
      // Optionally, add a query param to indicate a failed admin auth attempt
      url.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware to the backend path
  matcher: ['/backend/:path*'],
};
