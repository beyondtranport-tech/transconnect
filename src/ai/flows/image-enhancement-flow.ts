'use server';
/**
 * @fileOverview An AI-powered image enhancement tool.
 *
 * - enhanceImage - A function that enhances an image based on a text prompt.
 * - EnhanceImageInput - The input type for the enhanceImage function.
 * - EnhanceImageOutput - The return type for the enhanceImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const EnhanceImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo of a product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  prompt: z.string().describe('The text prompt describing the desired image enhancement.'),
});
export type EnhanceImageInput = z.infer<typeof EnhanceImageInputSchema>;

export const EnhanceImageOutputSchema = z.object({
    enhancedImageDataUri: z.string().describe('The enhanced image as a data URI.'),
});
export type EnhanceImageOutput = z.infer<typeof EnhanceImageOutputSchema>;

export async function enhanceImage(input: EnhanceImageInput): Promise<EnhanceImageOutput> {
  return enhanceImageFlow(input);
}

const enhanceImageFlow = ai.defineFlow(
  {
    name: 'enhanceImageFlow',
    inputSchema: EnhanceImageInputSchema,
    outputSchema: EnhanceImageOutputSchema,
  },
  async ({ imageDataUri, prompt }) => {
    
    const { media } = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image-preview',
        prompt: [
            { media: { url: imageDataUri } },
            { text: prompt },
        ],
        config: {
            responseModalities: ['TEXT', 'IMAGE'],
        },
    });

    if (!media?.url) {
        throw new Error('Image generation failed to return an image.');
    }
    
    return {
        enhancedImageDataUri: media.url,
    };
  }
);
