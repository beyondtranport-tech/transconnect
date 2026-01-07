import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const { idToken } = await request.json();

  if (idToken) {
    // Set the cookie to be used by server-side components and actions
    cookies().set('firebaseIdToken', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });
    return NextResponse.json({ success: true, message: 'Session cookie set.' });
  } else {
    // Clear the cookie on sign-out
    cookies().delete('firebaseIdToken');
    return NextResponse.json({ success: true, message: 'Session cookie cleared.' });
  }
}
