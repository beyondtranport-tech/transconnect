// This file is deprecated. Please use src/app/api/checkAndCreateUser/route.ts
import { NextResponse } from 'next/server';
export async function POST() {
    return NextResponse.json({ error: "Deprecated endpoint. Use /api/checkAndCreateUser instead." }, { status: 410 });
}
