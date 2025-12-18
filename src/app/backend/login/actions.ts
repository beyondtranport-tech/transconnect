
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function handleSecureAdminLogin(password: string) {
  try {
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

    if (!adminPassword) {
      return { error: 'Admin password is not configured on the server.' };
    }

    if (password === adminPassword) {
      cookies().set('secure-backend-access', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60, // 1 hour
      });
      // A successful login will redirect, no need to return a success object
    } else {
      return { error: 'Incorrect password.' };
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
        // This is an expected error when redirecting, so we re-throw it.
        throw error;
    }
    console.error('Secure admin login error:', error);
    return { error: 'An unexpected server error occurred.' };
  }

  // Redirect after the cookie has been set
  redirect('/backend');
}
