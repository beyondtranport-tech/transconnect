
import { NextResponse, type NextRequest } from 'next/server';
import { joseVerify, type JWTPayload } from 'jose';

// This function can be used in your middleware to verify the JWT
async function verifyToken(token: string): Promise<JWTPayload | null> {
    if (!token) {
        return null;
    }
    // In a real app, the secret would be a securely stored environment variable
    const secret = new TextEncoder().encode('your-fallback-secret-for-local-dev');
    try {
        const { payload } = await joseVerify(token, secret);
        return payload;
    } catch (err) {
        console.error('Token verification failed:', err);
        return null;
    }
}


export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    const tokenCookie = request.cookies.get('firebaseIdToken');
    const isAuthenticated = !!tokenCookie;
    
    let isAdmin = false;
    if (isAuthenticated) {
        try {
            const decodedTokenCookie = request.cookies.get('decodedToken');
            if (decodedTokenCookie) {
                const claims = JSON.parse(decodedTokenCookie.value).claims;
                if (claims && claims.email === 'beyondtransport@gmail.com') {
                     isAdmin = true;
                }
            }
        } catch (e) {
            // Ignore parsing error, isAdmin remains false
        }
    }
    
    const isAuthPage = pathname.startsWith('/signin') || pathname.startsWith('/join');

    // If the user is authenticated
    if (isAuthenticated) {
        // And they are on a sign-in/join page, redirect them to the correct dashboard.
        if (isAuthPage) {
            const url = request.nextUrl.clone();
            url.pathname = isAdmin ? '/backend' : '/account';
            return NextResponse.redirect(url);
        }
    } 
    // If the user is NOT authenticated
    else {
        // And they are trying to access a protected route, redirect them to sign-in.
        const protectedRoutes = ['/account', '/contribute', '/checkout', '/backend'];
        if (protectedRoutes.some(p => pathname.startsWith(p))) {
            const url = request.nextUrl.clone();
            const searchParams = url.searchParams;
            searchParams.set('redirect', pathname);
            url.pathname = '/signin';
            url.search = searchParams.toString();
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    // Match all paths except for static files, API routes, and image optimization.
    matcher: [
      '/((?!api|_next/static|_next/image|favicon.ico|images|brochures|.*\\.png$).*)',
    ],
};
