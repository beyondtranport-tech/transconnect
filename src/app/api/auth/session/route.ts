import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
let serviceAccount: any;
if (serviceAccountString) {
    try {
        serviceAccount = JSON.parse(serviceAccountString);
    } catch (e) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", e);
    }
}


// Ensure Firebase Admin is initialized only once.
if (!getApps().length) {
  if (serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    // This may work in environments like Cloud Run with Application Default Credentials
    // but we add a warning if the service account is missing.
    console.warn("FIREBASE_SERVICE_ACCOUNT environment variable not set. Firebase Admin SDK might not be initialized correctly.");
    initializeApp();
  }
}

export async function POST(request: Request) {
  const authorization = request.headers.get('Authorization');
  if (authorization?.startsWith('Bearer ')) {
    const idToken = authorization.split('Bearer ')[1];
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    try {
      const decodedToken = await getAuth().verifyIdToken(idToken);

      if (decodedToken.email === adminEmail) {
        // Secure, httpOnly cookie for 1 day
        const expiresIn = 60 * 60 * 24 * 1000;
        const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn });
        cookies().set('__session', sessionCookie, {
          maxAge: expiresIn,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          path: '/',
        });
        return NextResponse.json({ status: 'success' }, { status: 200 });
      } else {
        // Not an admin, deny setting the cookie.
        return NextResponse.json({ error: 'Not an admin' }, { status: 403 });
      }
    } catch (error) {
      console.error('Session login error:', error);
      return NextResponse.json({ error: 'Internal Server Error while verifying token.' }, { status: 500 });
    }
  }
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
