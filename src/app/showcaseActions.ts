
'use server';

import { generateVideo } from '@/ai/flows/video-generation-flow';

export async function generateShowcaseVideo() {
    try {
        const result = await generateVideo({
            prompt: `Create a short, professional marketing video that showcases how easy it is to create an online shop on the Logistics Flow platform. The video should visually represent these steps: 1. Sign up for a free account. 2. Use the simple Shop Wizard to add your business name, description, and products. 3. Publish your professional-looking online shop to the network. The video should be modern, clean, and use a color palette of green and charcoal.`,
            durationSeconds: 8
        });
        if (!result.videoDataUri) {
            throw new Error('Video generation failed to return a video URI.');
        }
        return { success: true, videoDataUri: result.videoDataUri };
    } catch (e: any) {
        console.error("Error generating showcase video:", e);
        return { success: false, error: e.message || "An unknown error occurred during video generation." };
    }
}
