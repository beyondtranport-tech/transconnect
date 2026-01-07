
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  const { app } = getAdminApp();
  if (!app) {
    return NextResponse.json({ success: false, error: "Admin SDK not initialized" }, { status: 500 });
  }

  const { idToken } = await req.json();

  if (!idToken) {
    // If no token, clear the cookie
    const response = NextResponse.json({ success: true, message: "Session cookie cleared" });
    response.cookies.set({
        name: 'decodedToken',
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        path: '/',
        sameSite: 'lax',
        maxAge: -1, // Expire immediately
    });
    return response;
  }

  try {
    const adminAuth = getAuth(app);
    // You could verify the token here if needed, but for setting a cookie, just passing it is often enough
    // const decodedToken = await adminAuth.verifyIdToken(idToken);

    const response = NextResponse.json({ success: true, message: "Session token set" });
    
    // Set the token in a secure, HttpOnly cookie.
    response.cookies.set({
      name: 'decodedToken',
      value: idToken,
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error: any) {
    console.error("Error setting session cookie:", error);
    return NextResponse.json({ success: false, error: "Failed to set session" }, { status: 500 });
  }
}

// Keep the GET function for compatibility if needed.
export async function GET() {
  return NextResponse.json({ message: 'Session endpoint' });
}
