
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    // The user's authentication state is stored in a cookie named `firebaseIdToken`
    // which is set on the client after a successful sign-in.
    // It's an HttpOnly cookie and secure, but its presence is a good signal.
    const isAuthenticated = request.cookies.has('firebaseIdToken');

    // For this environment, we check a simple client-set cookie for admin status.
    const isAdmin = request.cookies.get('isAdmin')?.value === 'true';

    // Protect backend routes
    if (pathname.startsWith('/backend') && !isAdmin) {
        // If not an admin, redirect away from the backend.
        // If not authenticated at all, redirect to sign-in with a redirect back to the backend.
        const redirectUrl = isAuthenticated ? '/account' : '/signin?redirect=/backend';
        return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // Protect other sensitive routes that require any authenticated user
    const protectedRoutes = ['/account', '/contribute'];
    if (protectedRoutes.some(p => pathname.startsWith(p)) && !isAuthenticated) {
        return NextResponse.redirect(new URL(`/signin?redirect=${pathname}`, request.url));
    }
    
    // If an already authenticated user tries to access sign-in or join pages, redirect them.
    if ((pathname.startsWith('/signin') || pathname.startsWith('/join')) && isAuthenticated) {
        const defaultRedirect = isAdmin ? '/backend' : '/account';
        return NextResponse.redirect(new URL(defaultRedirect, request.url));
    }

    return NextResponse.next();
}

export const config = {
    // Match all paths except for static files, API routes, and image optimization.
    matcher: [
      '/((?!api|_next/static|_next/image|favicon.ico|images|brochures).*)',
    ],
};
