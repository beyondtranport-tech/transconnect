import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// This is a temporary solution for service account credentials.
// In a real production environment, use environment variables
// or a secret manager.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

// Ensure Firebase Admin is initialized only once.
if (!getApps().length) {
  if (serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    // This will work in environments like Cloud Run where ADC is available.
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
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
