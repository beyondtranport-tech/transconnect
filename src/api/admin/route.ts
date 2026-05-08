// This file is deprecated. Please use src/app/api/admin/route.ts
import { NextResponse } from 'next/server';
export async function POST() {
    return NextResponse.json({ error: "Deprecated endpoint. Use /api/admin instead." }, { status: 410 });
}
