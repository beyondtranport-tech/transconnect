import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const adminToken = request.cookies.get('admin-auth-token');
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/backend')) {
    if (!adminToken || adminToken.value !== 'SUPER_SECRET_ADMIN_TOKEN_VALUE') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/backend/:path*'],
};
