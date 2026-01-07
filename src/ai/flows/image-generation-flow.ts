'use server';
/**
 * @fileOverview An AI-powered image generation tool using Google's Imagen model.
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
    
    const { media } = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt: `Generate an image based on the following prompt: ${prompt}`,
    });

    if (!media?.url) {
        throw new Error('Image generation failed to return an image.');
    }
    
    return {
        imageDataUri: media.url,
    };
  }
);
