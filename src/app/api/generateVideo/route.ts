
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';
import { generateVideo, GenerateVideoInputSchema } from '@/ai/flows/video-generation-flow';
import * as z from 'zod';

async function verifyUser(request: NextRequest): Promise<string> {
    const { app, error: initError } = getAdminApp();
    if (initError || !app) {
        throw new Error(`Admin SDK not initialized: ${initError}`);
    }

    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
        throw new Error('Unauthorized: Missing or invalid token.');
    }
    const token = authorization.split('Bearer ')[1];
    
    const adminAuth = getAuth(app);
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    return decodedToken.uid;
}


export async function POST(req: NextRequest) {
    try {
        await verifyUser(req);
        const body = await req.json();

        const validatedInput = GenerateVideoInputSchema.parse(body);

        const result = await generateVideo(validatedInput);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Error in generateVideo API:', error);
        
        let errorMessage = 'An unexpected error occurred.';
        let statusCode = 500;

        if (error instanceof z.ZodError) {
            errorMessage = `Invalid input: ${error.errors.map(e => e.message).join(', ')}`;
            statusCode = 400;
        } else if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
            statusCode = error.message.includes('Unauthorized') ? 401 : 403;
            errorMessage = error.message;
        } else if (error.message.includes('generation failed')) {
            errorMessage = 'The AI model failed to generate the video. Please try a different prompt.';
            statusCode = 502; // Bad Gateway
        }
        
        return NextResponse.json({ success: false, error: errorMessage }, { status: statusCode });
    }
}
