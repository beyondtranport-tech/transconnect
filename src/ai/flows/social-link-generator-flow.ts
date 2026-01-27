
'use server';
/**
 * @fileOverview An AI-powered flow to suggest social media links for a shop.
 *
 * - generateSocialLinks - A function that suggests social media URLs based on a shop name.
 * - SocialLinkGeneratorInput - The input type for the function.
 * - SocialLinkGeneratorOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import { SocialLinkGeneratorInputSchema, SocialLinkGeneratorOutputSchema, type SocialLinkGeneratorInput, type SocialLinkGeneratorOutput } from '@/ai/schemas';

export async function generateSocialLinks(input: SocialLinkGeneratorInput): Promise<SocialLinkGeneratorOutput> {
  return socialLinkGeneratorFlow(input);
}

const socialLinkGeneratorFlow = ai.defineFlow(
  {
    name: 'socialLinkGeneratorFlow',
    inputSchema: SocialLinkGeneratorInputSchema,
    outputSchema: SocialLinkGeneratorOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
        model: 'googleai/gemini-1.5-flash-latest',
        prompt: `You are an assistant that creates plausible social media URLs for a business.
        Given the shop name "${input.shopName}", create conventional, best-guess URLs for the following platforms: Facebook, Instagram, Twitter (X), LinkedIn (as a company page), and YouTube.
        - Sanitize the shop name to be URL-friendly (remove spaces, special characters).
        - For Twitter/X, keep the name short if possible.
        - For LinkedIn, use the /company/ path.
        `,
        output: {
            schema: SocialLinkGeneratorOutputSchema
        }
    });

    return output || {};
  }
);
