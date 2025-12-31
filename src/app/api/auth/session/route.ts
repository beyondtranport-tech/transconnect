
import { NextResponse } from 'next/server';

// This file can be used for session management if needed in the future.
// For now, it contains a placeholder GET function to ensure the Next.js build succeeds,
// as empty API route files can sometimes cause unpredictable build errors.
export async function GET() {
  return NextResponse.json({ message: 'Session endpoint' });
}
