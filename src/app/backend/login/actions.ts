'use server';

import { cookies } from 'next/headers';

export async function handleSecureAdminLogin(password: string) {
  try {
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

    if (!adminPassword) {
      return { success: false, error: 'Admin password is not configured on the server.' };
    }

    if (password === adminPassword) {
      cookies().set('secure-backend-access', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/backend/secure',
        maxAge: 60 * 60, // 1 hour
      });
      return { success: true };
    } else {
      return { success: false, error: 'Incorrect password.' };
    }
  } catch (error) {
    console.error('Secure admin login error:', error);
    return { success: false, error: 'An unexpected server error occurred.' };
  }
}
