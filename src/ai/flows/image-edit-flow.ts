'use server';
/**
 * @fileOverview An AI-powered image editing flow.
 *
 * - imageEditFlow - A Genkit flow that edits an image based on a text prompt.
 * - ImageEditInput - The input type for the imageEditFlow function.
 * - ImageEditOutput - The return type for the imageEditFlow function.
 */

import { ai } from '@/ai/genkit';
import { ImageEditInputSchema, ImageEditOutputSchema } from '@/ai/schemas';

export const imageEditFlow = ai.defineFlow(
  {
    name: 'imageEditFlow',
    inputSchema: ImageEditInputSchema,
    outputSchema: ImageEditOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'gemini-pro',
      prompt: [
        { media: { url: input.photoDataUri } },
        { text: input.prompt },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('Image generation failed to return an image.');
    }
    
    return { enhancedImageDataUri: media.url };
  }
);
