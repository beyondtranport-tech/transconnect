
import { NextRequest, NextResponse } from 'next/server';
import { imageEditFlow } from '@/ai/flows/image-edit-flow';

export async function POST(req: NextRequest) {
    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ success: false, error: "GEMINI_API_KEY is not set." }, { status: 500 });
    }

    try {
        const { imageDataUri, prompt } = await req.json();

        if (!imageDataUri || !prompt) {
            return NextResponse.json({ success: false, error: 'Missing imageDataUri or prompt in request body.' }, { status: 400 });
        }
        
        const result = await imageEditFlow({ photoDataUri: imageDataUri, prompt });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in /api/enhanceImage:', error);
        return NextResponse.json({ success: false, error: error.message || 'An unknown error occurred.' }, { status: 500 });
    }
}
