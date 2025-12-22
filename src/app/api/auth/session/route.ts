// This file is intentionally left blank. The session logic is now handled by the middleware.
// The file is kept to prevent Next.js from throwing errors about a deleted file that might be cached in the build process.
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ message: 'This endpoint is not used.' }, { status: 404 });
}

export async function POST() {
     return NextResponse.json({ message: 'This endpoint is not used.' }, { status: 404 });
}
