'use server';

import { cookies } from 'next/headers';

const ADMIN_TOKEN_NAME = 'admin-auth-token';

export async function handleAdminLogin(password: string) {
  if (password === process.env.SUPER_ADMIN_PASSWORD) {
    // In a real app, you'd generate a secure, signed token (e.g., JWT).
    // For this prototype, we'll use a simple static value.
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
}

export async function handleAdminLogout() {
  cookies().delete(ADMIN_TOKEN_NAME);
  return { success: true };
}
