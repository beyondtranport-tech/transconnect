'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';
import { imageEditFlow } from '@/ai/flows/image-edit-flow';

export async function POST(req: NextRequest) {
    const { app, error: initError } = getAdminApp();
    if (initError || !app) {
        console.error("Admin SDK init error in /api/editImage:", initError);
        return NextResponse.json({ error: 'Internal Server Error: Could not connect to Firebase.' }, { status: 500 });
    }

    const authorization = req.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized: No token provided.' }, { status: 401 });
    }
    
    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: "Configuration error: GEMINI_API_KEY is not set." }, { status: 500 });
    }

    try {
        const token = authorization.split('Bearer ')[1];
        const adminAuth = getAuth(app);
        await adminAuth.verifyIdToken(token);
        
        const { photoDataUri, prompt } = await req.json();

        if (!photoDataUri || !prompt) {
            return NextResponse.json({ error: 'Bad Request: Missing photoDataUri or prompt in request body.' }, { status: 400 });
        }
        
        const result = await imageEditFlow({ photoDataUri, prompt });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Error in /api/editImage route:', error);
        if (error.code?.startsWith('auth/')) {
            return NextResponse.json({ error: 'Authentication error.' }, { status: 401 });
        }
        return NextResponse.json({ error: error.message || 'An unknown server error occurred.' }, { status: 500 });
    }
}
