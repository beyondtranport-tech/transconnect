
'use server';
/**
 * @fileOverview An AI-powered image editing flow.
 *
 * - imageEdit - A function that edits an image based on a text prompt.
 * - ImageEditInput - The input type for the imageEdit function.
 * - ImageEditOutput - The return type for the imageEdit function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { ImageEditInputSchema, ImageEditOutputSchema, type ImageEditInput, type ImageEditOutput } from '@/ai/schemas';

export async function imageEdit(input: ImageEditInput): Promise<ImageEditOutput> {
  const { media } = await ai.generate({
    model: googleAI.model('gemini-2.5-flash-image'),
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

ai.defineFlow(
  {
    name: 'imageEditFlow',
    inputSchema: ImageEditInputSchema,
    outputSchema: ImageEditOutputSchema,
  },
  imageEdit
);
