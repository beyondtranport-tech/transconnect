import { NextRequest, NextResponse } from 'next/server';
import { editImage } from '@/ai/flows/image-edit-flow';

export async function POST(req: NextRequest) {
    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ success: false, error: "GEMINI_API_KEY is not set." }, { status: 500 });
    }

    try {
        const { photoDataUri, prompt } = await req.json();

        if (!photoDataUri || !prompt) {
            return NextResponse.json({ success: false, error: 'Missing photoDataUri or prompt in request body.' }, { status: 400 });
        }
        
        const result = await editImage({ photoDataUri, prompt });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in /api/editImage:', error);
        return NextResponse.json({ success: false, error: error.message || 'An unknown error occurred.' }, { status: 500 });
    }
}
