
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isAuthenticated = request.cookies.has('firebaseIdToken');

    // This is a simplified check. A robust solution would involve verifying the token
    // on a backend and setting a secure, httpOnly cookie with role information.
    // For this environment, we'll check a simple isAdmin cookie set during login.
    const isAdmin = request.cookies.get('isAdmin')?.value === 'true';

    // Protect backend routes
    if (pathname.startsWith('/backend') && !isAuthenticated) {
        return NextResponse.redirect(new URL('/signin?redirect=/backend', request.url));
    }
    // If not an admin, redirect from backend to account page
    if (pathname.startsWith('/backend') && isAuthenticated && !isAdmin) {
         return NextResponse.redirect(new URL('/account', request.url));
    }

    // Protect account page
    if (pathname.startsWith('/account') && !isAuthenticated) {
        return NextResponse.redirect(new URL(`/signin?redirect=${pathname}`, request.url));
    }
    
    // Protect contribution page
    if (pathname.startsWith('/contribute') && !isAuthenticated) {
         return NextResponse.redirect(new URL(`/signin?redirect=${pathname}`, request.url));
    }

    // Redirect authenticated users from signin/join pages
    if ((pathname.startsWith('/signin') || pathname.startsWith('/join')) && isAuthenticated) {
        const redirectParam = request.nextUrl.searchParams.get('redirect');
        
        // If user is admin and trying to sign in, redirect to backend.
        // The redirect param might be for a non-admin page.
        if (isAdmin) {
            return NextResponse.redirect(new URL(redirectParam || '/backend', request.url));
        }

        const defaultRedirect = '/account';
        return NextResponse.redirect(new URL(redirectParam || defaultRedirect, request.url));
    }

    return NextResponse.next();
}

export const config = {
    // Match all paths except for static files, API routes, and image optimization.
    matcher: [
      '/((?!api|_next/static|_next/image|favicon.ico|images|brochures).*)',
    ],
};
