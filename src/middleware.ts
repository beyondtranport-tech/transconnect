
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify, createRemoteJWKSet } from 'jose';

const ADMIN_EMAIL = 'beyondtransport@gmail.com';
const FIREBASE_PROJECT_ID = 'transconnect-v1-39578841-2a857';

const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_account/v1/jwk/securetoken@system.gserviceaccount.com')
);

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
    });
    return payload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const token = request.cookies.get('firebaseIdToken')?.value;
  const decodedToken = token ? await verifyToken(token) : null;
  const isAdmin = decodedToken?.email === ADMIN_EMAIL;
  
  const signinUrl = new URL('/signin', request.url);
  const backendUrl = new URL('/backend', request.url);
  const accountUrl = new URL('/account', request.url);

  // --- Logic for /backend path ---
  if (pathname.startsWith('/backend')) {
    if (!isAdmin) {
      signinUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signinUrl);
    }
    return NextResponse.next();
  }
  
  // --- Logic for /account path ---
  if (pathname.startsWith('/account')) {
    if (!decodedToken) {
      signinUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signinUrl);
    }
    return NextResponse.next();
  }

  // --- Logic for when user is on the /signin page ---
  if (pathname.startsWith('/signin')) {
    // If the user is already logged in, redirect them away from the sign-in page.
    if (decodedToken) {
      const redirectParam = searchParams.get('redirect');
      if (redirectParam) {
        // If there's a redirect param, trust it, but check admin access for /backend.
        if (redirectParam.startsWith('/backend') && !isAdmin) {
          return NextResponse.redirect(accountUrl); // Non-admin trying to go to backend.
        }
        return NextResponse.redirect(new URL(redirectParam, request.url));
      }
      // If no redirect param, send admin to backend, others to account.
      return NextResponse.redirect(isAdmin ? backendUrl : accountUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/backend/:path*', '/account/:path*', '/signin'],
};
