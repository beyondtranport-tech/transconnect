'use server';

import { cookies } from 'next/headers';

const ADMIN_TOKEN_NAME = 'admin-auth-token';

export async function handleAdminLogin(password: string) {
  try {
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'admin';

    if (password === adminPassword) {
      const adminToken = 'SUPER_SECRET_ADMIN_TOKEN_VALUE';
      cookies().set(ADMIN_TOKEN_NAME, adminToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60, // 1 hour
      });
      return { success: true };
    } else {
      return { success: false, error: 'Incorrect password.' };
    }
  } catch (error) {
    console.error('Error in handleAdminLogin:', error);
    // Ensure that even if a server error occurs (e.g., with cookies), a response is sent.
    return { success: false, error: 'An unexpected server error occurred.' };
  }
}

export async function handleAdminLogout() {
  cookies().delete(ADMIN_TOKEN_NAME);
  return { success: true };
}
