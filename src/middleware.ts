
import { NextResponse, type NextRequest } from 'next/server';
import { joseVerify, type JWTPayload } from 'jose';

// This function can be used in your middleware to verify the JWT
async function verifyToken(token: string): Promise<JWTPayload | null> {
    if (!token) {
        return null;
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-fallback-secret-for-local-dev');
    try {
        const { payload } = await joseVerify(token, secret, {
            issuer: 'urn:example:issuer',
            audience: 'urn:example:audience',
        });
        return payload;
    } catch (err) {
        console.error('Token verification failed:', err);
        return null;
    }
}


export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    // Check for the presence of the decodedToken cookie
    const tokenCookie = request.cookies.get('decodedToken');
    let isAuthenticated = false;
    let isAdmin = false;

    if (tokenCookie) {
        try {
            const decodedPayload = JSON.parse(tokenCookie.value);
            if (decodedPayload && decodedPayload.uid) {
                isAuthenticated = true;
                if (decodedPayload.email === 'beyondtransport@gmail.com') {
                    isAdmin = true;
                }
            }
        } catch (e) {
            // Invalid JSON in cookie
            isAuthenticated = false;
            isAdmin = false;
        }
    }
    
    // Protect backend routes
    if (pathname.startsWith('/backend') && !isAdmin) {
        const redirectUrl = isAuthenticated ? '/account' : `/signin?redirect=${pathname}`;
        return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // Protect other sensitive routes that require any authenticated user
    const protectedRoutes = ['/account', '/contribute', '/checkout'];
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
