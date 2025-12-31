
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isAuthenticated = request.cookies.has('firebaseIdToken');

    // Simple check for admin based on a separate cookie or role claim if available.
    // For this fix, we will rely on the API routes to perform the final admin check.
    // The main goal is to remove the Admin SDK from the middleware.
    
    // This logic assumes that if a user has a token and goes to /backend,
    // the backend page itself or its API routes will verify if the user is truly an admin.
    // A non-admin will be redirected from the backend page itself if they somehow land there.

    // Protect backend routes - check for authentication cookie
    if (pathname.startsWith('/backend') && !isAuthenticated) {
        return NextResponse.redirect(new URL('/signin?redirect=/backend', request.url));
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
        const decodedTokenCookie = request.cookies.get('decodedToken');
        let isAdmin = false;
        if (decodedTokenCookie) {
            try {
                const decodedToken = JSON.parse(decodedTokenCookie.value);
                if (decodedToken.email === 'beyondtransport@gmail.com') {
                    isAdmin = true;
                }
            } catch(e) {
                // ignore parsing error
            }
        }
        const defaultRedirect = isAdmin ? '/backend' : '/account';
        const redirectParam = request.nextUrl.searchParams.get('redirect');

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
