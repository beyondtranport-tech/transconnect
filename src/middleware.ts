import { NextResponse, type NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from './lib/firebase-admin';

async function getDecodedToken(request: NextRequest) {
    const token = request.cookies.get('firebaseIdToken')?.value;
    if (!token) return null;
    
    const { app } = getAdminApp();
    if (!app) return null;

    try {
        const auth = getAuth(app);
        return await auth.verifyIdToken(token);
    } catch (error) {
        console.warn('Middleware: Invalid auth token:', error);
        return null;
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const decodedToken = await getDecodedToken(request);
    const isAuthenticated = !!decodedToken;
    const isAdmin = isAuthenticated && decodedToken.email === 'beyondtransport@gmail.com';

    // Protect backend routes
    if (pathname.startsWith('/backend')) {
        if (!isAuthenticated) {
            return NextResponse.redirect(new URL('/signin?redirect=/backend', request.url));
        }
        if (!isAdmin) {
            return NextResponse.redirect(new URL('/account', request.url)); // Redirect non-admins away
        }
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
        return NextResponse.redirect(new URL('/account', request.url));
    }

    return NextResponse.next();
}

export const config = {
    // Match all paths except for static files, API routes, and image optimization.
    matcher: [
      '/((?!api|_next/static|_next/image|favicon.ico|images|brochures).*)',
    ],
};
