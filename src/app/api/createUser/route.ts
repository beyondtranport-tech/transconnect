
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

// THIS ROUTE IS DEPRECATED AND REPLACED BY checkAndCreateUser
// Kept for compatibility during transition, should be removed later.

export async function POST(req: NextRequest) {
  return NextResponse.json({ success: false, error: 'This endpoint is deprecated. Please use /api/checkAndCreateUser.' }, { status: 410 });
}
