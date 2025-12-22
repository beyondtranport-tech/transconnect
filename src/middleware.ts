
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// This file is temporarily disabled to allow for admin user creation.
// It will be re-enabled in the next step.

export const runtime = 'nodejs';

export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/backend/:path*'],
};
