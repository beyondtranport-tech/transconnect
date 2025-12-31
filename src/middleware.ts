
import { NextResponse, type NextRequest } from 'next/server';
import { joseVerify } from 'jose';

// The secret key for verifying the JWT. In a production environment,
// this should be stored securely as an environment variable.
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-fallback-secret-for-local-dev');

async function verifyAndDecodeToken(token: string): Promise<any | null> {
    if (!token) return null;
    try {
        // In a real production app, you might fetch the public key from a JWKS endpoint.
        // For this demo, we use a symmetric secret.
        const { payload } = await joseVerify(token, secret);
        return payload;
    } catch (err) {
        console.error('Token verification failed:', err);
        return null;
    }
}

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
            const claims = JSON.parse(token).claims;
            if (claims && claims.user_id) {
                isAuthenticated = true;
                if (claims.email === 'beyondtransport@gmail.com') {
                    isAdmin = true;
                }
            }
        } catch (e) {
             console.error("Failed to parse token cookie:", e);
             // Let isAuthenticated remain false
        }
    }
    
    const isAuthPage = pathname === '/signin' || pathname === '/join';
    const isBackendRoute = pathname.startsWith('/backend');
    const isAccountRoute = pathname.startsWith('/account');

    // If user is authenticated
    if (isAuthenticated) {
        // If they are trying to access the backend...
        if (isBackendRoute) {
            // ...but are not an admin, redirect to account page.
            if (!isAdmin) {
                return NextResponse.redirect(new URL('/account', request.url));
            }
            // ...and are an admin, let them proceed.
            return NextResponse.next();
        }

        // If they are on a sign-in/join page, redirect them away.
        if (isAuthPage) {
            const redirectUrl = isAdmin ? '/backend' : '/account';
            return NextResponse.redirect(new URL(redirectUrl, request.url));
        }
    } 
    // If user is NOT authenticated
    else {
        // And is trying to access a protected route, redirect to sign-in.
        if (isAccountRoute || isBackendRoute) {
            const url = new URL('/signin', request.url);
            url.searchParams.set('redirect', pathname);
            return NextResponse.redirect(url);
        }
    }
    
    // For all other cases, allow the request to proceed.
    return NextResponse.next();
}

export const config = {
    matcher: [
      '/((?!api|_next/static|_next/image|favicon.ico|images|brochures|.*\\.png$).*)',
    ],
};
