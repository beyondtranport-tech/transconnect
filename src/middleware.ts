import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware is temporarily disabled to allow for admin user creation.
// Please instruct the AI to re-enable it after the admin user has been successfully created.

export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/backend/:path*'],
};
