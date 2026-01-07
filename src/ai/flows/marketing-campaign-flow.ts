
'use server';
/**
 * @fileOverview An AI-powered image generation tool using Google's Imagen model.
 * This is a temporary replacement for the marketing flow to diagnose an error.
 *
 * - generateMarketingCampaign - A function that generates an image from a text prompt.
 * - MarketingBriefInput - The input type for the function.
 * - CampaignIdeaOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const MarketingBriefInputSchema = z.object({
  prompt: z.string().describe('The text prompt describing the desired image content.'),
});
export type MarketingBriefInput = z.infer<typeof MarketingBriefInputSchema>;

export const CampaignIdeaOutputSchema = z.object({
  imageDataUri: z.string().describe('The generated image as a data URI.'),
});
export type CampaignIdeaOutput = z.infer<typeof CampaignIdeaOutputSchema>;

// This wrapper function keeps the same name to match the UI call.
export async function generateMarketingCampaign(input: MarketingBriefInput): Promise<CampaignIdeaOutput> {
  return generateImageFlow(input);
}

export const generateImageFlow = ai.defineFlow(
  {
    name: 'generateMarketingCampaignImageFlow', // Renamed to avoid conflicts
    inputSchema: MarketingBriefInputSchema,
    outputSchema: CampaignIdeaOutputSchema,
  },
  async ({ prompt }) => {
    
    const { media } = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt: prompt,
    });

    if (!media?.url) {
        throw new Error('Image generation failed to return an image.');
    }
    
    return {
        imageDataUri: media.url,
    };
  }
);
