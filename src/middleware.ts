
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

// Middleware is temporarily disabled to allow for admin user setup.
// This will be re-enabled.
export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/backend/:path*'],
};
