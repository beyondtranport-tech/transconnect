
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify, createRemoteJWKSet } from 'jose';

const ADMIN_EMAIL = 'beyondtransport@gmail.com';
const FIREBASE_PROJECT_ID = 'transconnect-v1-39578841-2a857';

// The JWKS (JSON Web Key Set) URL for Firebase Auth.
// This is a standard endpoint for fetching public keys to verify JWTs.
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
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/backend')) {
    const token = request.cookies.get('firebaseIdToken')?.value;
    const signinUrl = new URL('/signin', request.url);
    signinUrl.searchParams.set('redirect', pathname);

    if (!token) {
      return NextResponse.redirect(signinUrl);
    }

    const decodedToken = await verifyToken(token);

    if (!decodedToken || decodedToken.email !== ADMIN_EMAIL) {
      return NextResponse.redirect(signinUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/backend/:path*'],
};
