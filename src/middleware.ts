
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminSession = request.cookies.get('admin-session')?.value;

  // 1. If trying to access a protected backend route
  if (pathname.startsWith('/backend') && pathname !== '/backend/login') {
    // If no session cookie, redirect to the admin login page
    if (!adminSession) {
      return NextResponse.redirect(new URL('/backend/login', request.url));
    }

    try {
      // 2. Verify the session by checking its value against the env variable
      // In a real app, this would be a more secure JWT verification
      const isValid = adminSession === process.env.SUPER_ADMIN_PASSWORD;
      
      if (!isValid) {
        throw new Error("Invalid session");
      }

      // 3. Session is valid, allow access
      return NextResponse.next();

    } catch (error) {
      // Session is invalid. Redirect to login.
      const url = request.nextUrl.clone();
      url.pathname = '/backend/login';
      const response = NextResponse.redirect(url);
      // Clear the invalid cookie
      response.cookies.delete('admin-session');
      return response;
    }
  }
  
  // If accessing the login page with a valid session, redirect to the dashboard
  if (pathname === '/backend/login' && adminSession === process.env.SUPER_ADMIN_PASSWORD) {
     return NextResponse.redirect(new URL('/backend', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Match all backend routes
  matcher: ['/backend/:path*'],
};
