import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/ai/flows/image-generation-flow';

export async function POST(req: NextRequest) {
    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ success: false, error: "GEMINI_API_KEY is not set." }, { status: 500 });
    }

    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json({ success: false, error: 'Missing prompt in request body.' }, { status: 400 });
        }
        
        const result = await generateImage({ prompt });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in /api/generateImage:', error);
        return NextResponse.json({ success: false, error: error.message || 'An unknown error occurred.' }, { status: 500 });
    }
}
