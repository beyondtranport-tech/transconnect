
'use server';
/**
 * @fileOverview An AI-powered image generation tool using Google's Gemini model.
 * This file contains the server-side Genkit flow logic.
 */

import { ai } from '@/ai/genkit';
import { GenerateImageInputSchema, GenerateImageOutputSchema } from './schemas';
import type { GenerateImageInput, GenerateImageOutput } from './schemas';

// This is the function that will be called by the server action.
export async function generateImageFlow(input: GenerateImageInput): Promise<GenerateImageOutput> {
    return imageGenerationFlow(input);
}

const imageGenerationFlow = ai.defineFlow(
  {
    name: 'imageGenerationFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async ({ prompt }) => {
    
    // Use gemini-2.5-flash-image-preview for text-to-image generation
    const { media } = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image-preview',
        prompt: prompt, // This model can accept a simple string prompt for generation
        config: {
            // It's good practice to specify you expect an IMAGE response
            responseModalities: ['IMAGE'], 
        },
    });

    if (!media?.url) {
        throw new Error('Image generation failed to return an image.');
    }
    
    return {
        imageDataUri: media.url,
    };
  }
);
