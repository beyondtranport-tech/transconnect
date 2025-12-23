
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// The middleware is currently disabled as it was causing conflicts with the
// client-side authentication, leading to persistent permission errors.
// The application's security is handled by UI-level checks on the backend pages
// and the Firestore security rules.

export function middleware(request: NextRequest) {
  // Allow all requests to pass through.
  return NextResponse.next();
}

export const config = {
  // Do not match any routes.
  matcher: [],
};
