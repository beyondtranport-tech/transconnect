
'use server';
/**
 * @fileOverview An AI-powered image editing flow.
 *
 * - editImage - A function that edits an image based on a text prompt.
 * - ImageEditInput - The input type for the editImage function.
 * - ImageEditOutput - The return type for the editImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const ImageEditInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to edit, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  prompt: z.string().describe('The text prompt describing the desired edit.'),
});
export type ImageEditInput = z.infer<typeof ImageEditInputSchema>;

export const ImageEditOutputSchema = z.object({
  enhancedImageDataUri: z
    .string()
    .describe('The edited image as a data URI.'),
});
export type ImageEditOutput = z.infer<typeof ImageEditOutputSchema>;


export async function editImage(input: ImageEditInput): Promise<ImageEditOutput> {
  const { media } = await ai.generate({
    model: 'googleai/gemini-2.5-flash-image-preview',
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

// Note: A flow is not strictly necessary if the logic is simple.
// We are exporting the async function directly. For more complex scenarios,
// wrapping this in an ai.defineFlow() would be appropriate.
