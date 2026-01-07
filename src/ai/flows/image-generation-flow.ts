'use server';
/**
 * @fileOverview An AI-powered image generation tool using Google's Imagen model.
 * This file contains the server-side Genkit flow logic.
 */

import { ai } from '@/ai/genkit';
import { GenerateImageInputSchema, GenerateImageOutputSchema } from './schemas';
import type { GenerateImageInput } from './schemas';

// This is the function that will be called by the server action.
export async function generateImageFlow(input: GenerateImageInput) {
    const { output } = await imageGenerationPrompt(input);
    if (!output) {
      throw new Error("Image generation did not return an output.");
    }
    return output;
}

const imageGenerationPrompt = ai.definePrompt({
    name: 'imageGenerationPrompt',
    input: { schema: GenerateImageInputSchema },
    output: { schema: GenerateImageOutputSchema },
    prompt: `Generate an image based on the following prompt: {{{prompt}}}`,
    config: {
        model: 'googleai/imagen-4.0-fast-generate-001'
    }
});
