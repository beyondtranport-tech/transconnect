
import { NextResponse, type NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

// This function is for decoding the token, but we won't use it to block.
// The presence of the cookie is enough for the middleware's purpose.
async function verifyToken(token: string) {
    try {
        const { app } = getAdminApp();
        if (!app) return null;
        const adminAuth = getAuth(app);
        const decodedToken = await adminAuth.verifyIdToken(token);
        return decodedToken;
    } catch (error) {
        // This is expected if the token is invalid or expired
        return null;
    }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const idTokenCookie = request.cookies.get('firebaseIdToken');
  const isAuthenticated = !!idTokenCookie;

  const isAuthPage = pathname.startsWith('/signin') || pathname.startsWith('/join');
  const isBackend = pathname.startsWith('/backend');

  if (isAuthenticated && isAuthPage) {
    let isAdmin = false;
    // We can't use verifyToken here because of edge runtime limitations.
    // A simple heuristic for now until a better method is found.
    // A robust solution might involve a separate API call from client to determine role.
    // For now, we rely on client-side logic to handle admin redirect.
    // The main job here is to get non-admins out of the sign-in page.
    const redirectUrl = new URL('/account', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (!isAuthenticated && isBackend) {
     const redirectUrl = new URL('/signin', request.url);
     redirectUrl.searchParams.set('redirect', pathname);
     return NextResponse.redirect(redirectUrl);
  }

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
