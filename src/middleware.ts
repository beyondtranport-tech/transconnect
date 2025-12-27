
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { serviceAccount } from './firebase/service-account-credentials';

const ADMIN_EMAIL = 'beyondtransport@gmail.com';

// Initialize Firebase Admin SDK
function initializeAdminApp(): App {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0]!;
  }
  return initializeApp({
    credential: {
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    },
  });
}

async function verifyToken(token: string) {
  try {
    const adminApp = initializeAdminApp();
    const decodedToken = await getAuth(adminApp).verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying token in middleware:', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all backend routes
  if (pathname.startsWith('/backend')) {
    const token = request.cookies.get('firebaseIdToken')?.value;
    const signinUrl = new URL('/signin', request.url);
    signinUrl.searchParams.set('redirect', pathname);

    if (!token) {
      return NextResponse.redirect(signinUrl);
    }

    const decodedToken = await verifyToken(token);

    if (!decodedToken || decodedToken.email !== ADMIN_EMAIL) {
      // If not an admin, redirect to sign-in page
      return NextResponse.redirect(signinUrl);
    }
  }

  // Allow the request to proceed
  return NextResponse.next();
}

export const config = {
  // Match all backend routes
  matcher: ['/backend/:path*'],
};
