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
      return { success: true, error: null };
    } else {
      return { success: false, error: 'Incorrect password.' };
    }
  } catch (error) {
    console.error('Error in handleAdminLogin:', error);
    return { success: false, error: 'A server error occurred.' };
  }
}
