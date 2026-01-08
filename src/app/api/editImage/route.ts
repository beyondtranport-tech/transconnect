
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';
import { editImage } from '@/ai/flows/image-edit-flow';

export async function POST(req: NextRequest) {
    const { app, error: initError } = getAdminApp();
    if (initError || !app) {
        return NextResponse.json({ success: false, error: 'Internal Server Error: Could not connect to Firebase.' }, { status: 500 });
    }

    const authorization = req.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
        return NextResponse.json({ success: false, error: 'Unauthorized: No token provided.' }, { status: 401 });
    }
    
    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ success: false, error: "GEMINI_API_KEY is not set." }, { status: 500 });
    }

    try {
        const token = authorization.split('Bearer ')[1];
        const adminAuth = getAuth(app);
        await adminAuth.verifyIdToken(token);
        
        const { photoDataUri, prompt } = await req.json();

        if (!photoDataUri || !prompt) {
            return NextResponse.json({ success: false, error: 'Missing photoDataUri or prompt in request body.' }, { status: 400 });
        }
        
        const result = await editImage({ photoDataUri, prompt });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Error in /api/editImage:', error);
        if (error.code?.startsWith('auth/')) {
            return NextResponse.json({ success: false, error: 'Authentication error.' }, { status: 401 });
        }
        return NextResponse.json({ success: false, error: error.message || 'An unknown error occurred.' }, { status: 500 });
    }
}
