
import { NextResponse } from 'next/server';

// This file is no longer used and is kept to prevent build errors.
// The new cleanup logic is handled client-side.

export async function POST(request: Request) {
  return NextResponse.json({ message: 'This endpoint is deprecated.' }, { status: 410 });
}
