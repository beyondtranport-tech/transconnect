'use server';
/**
 * @fileOverview A diagnostic AI flow to generate a simple tagline.
 * This serves as a stable test for core text generation functionality.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/google-genai';

const MarketingCampaignInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
});
export type MarketingCampaignInput = z.infer<
  typeof MarketingCampaignInputSchema
>;

const MarketingCampaignOutputSchema = z.object({
  tagline: z.string().describe('A catchy tagline for the product.'),
});
export type MarketingCampaignOutput = z.infer<
  typeof MarketingCampaignOutputSchema
>;

export async function generateMarketingCampaign(
  input: MarketingCampaignInput
): Promise<MarketingCampaignOutput> {
  const prompt = `Generate a short, catchy tagline for the following product: ${input.productName}`;

  const { output } = await ai.generate({
    model: 'googleai/gemini-2.5-flash-image-preview',
    prompt: prompt,
    output: {
      schema: MarketingCampaignOutputSchema,
    },
  });

  return output!;
}
