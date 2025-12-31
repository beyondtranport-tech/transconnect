
import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = request.cookies.has('decodedToken');

  const isAuthPage = pathname === '/signin' || pathname === '/join';
  const isAccountRoute = pathname.startsWith('/account');
  const isBackendRoute = pathname.startsWith('/backend');
  const isProtected = isAccountRoute || isBackendRoute;

  // If user is authenticated
  if (isAuthenticated) {
    // And is trying to access a signin/join page, redirect them away
    if (isAuthPage) {
      // This is a simplified check. A full implementation would check claims for admin role.
      // For now, we assume if you are going to /backend you must be admin.
      // A more robust solution might involve parsing the cookie here.
      // But we will keep it simple to fix the redirect loop.
      const redirectUrl = new URL('/account', request.url);
      return NextResponse.redirect(redirectUrl);
    }
  } 
  // If user is not authenticated
  else {
    // And is trying to access a protected route, redirect to signin
    if (isProtected) {
      const redirectUrl = new URL('/signin', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Allow all other requests
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images)
     * - brochures (public brochures)
     * - .png, .svg, .jpg, .jpeg, .gif, .webp (image extensions)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|brochures|.*\\.(?:png|svg|jpg|jpeg|gif|webp)$).*)',
  ],
};
