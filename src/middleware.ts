
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    // Attempt to get the token from cookies
    const tokenCookie = request.cookies.get('decodedToken');
    const token = tokenCookie?.value;

    let isAuthenticated = false;
    let isAdmin = false;

    if (token) {
        try {
            // Because the cookie stores the JSON string of the decoded token, we just parse it.
            // This is not a security verification, just a state check. 
            // Verification happens on the server with Admin SDK.
            const claims = JSON.parse(token).claims;
            if (claims && claims.user_id) {
                isAuthenticated = true;
                if (claims.email === 'beyondtransport@gmail.com') {
                    isAdmin = true;
                }
            }
        } catch (e) {
             console.error("Failed to parse token cookie in middleware:", e);
             // Let isAuthenticated remain false
        }
    }
    
    const isAuthPage = pathname === '/signin' || pathname === '/join';
    const isBackendRoute = pathname.startsWith('/backend');
    const isAccountRoute = pathname.startsWith('/account');

    // If user is authenticated...
    if (isAuthenticated) {
        // ...and they are trying to access a sign-in/join page...
        if (isAuthPage) {
            // ...redirect them to their correct dashboard.
            const redirectUrl = isAdmin ? '/backend' : '/account';
            return NextResponse.redirect(new URL(redirectUrl, request.url));
        }

        // ...and they are NOT an admin but try to access the backend...
        if (isBackendRoute && !isAdmin) {
             // ...redirect them to the member account page.
            return NextResponse.redirect(new URL('/account', request.url));
        }
    } 
    // If user is NOT authenticated...
    else {
        // ...and is trying to access a protected route...
        if (isAccountRoute || isBackendRoute) {
            // ...redirect them to the sign-in page, preserving the intended destination.
            const url = new URL('/signin', request.url);
            url.searchParams.set('redirect', pathname);
            return NextResponse.redirect(url);
        }
    }
    
    // For all other cases (e.g., public pages), allow the request to proceed.
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
