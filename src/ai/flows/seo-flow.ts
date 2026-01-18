'use server';
/**
 * @fileOverview An AI-powered SEO content generation flow for shops.
 *
 * - generateShopSeo - A function that creates SEO content based on shop details.
 * - ShopSeoInput - The input type for the generateShopSeo function.
 * - ShopSeoOutput - The return type for the generateShopSeo function.
 */

import { ai } from '@/ai/genkit';
import { ShopSeoInputSchema, ShopSeoOutputSchema, type ShopSeoInput, type ShopSeoOutput } from '@/ai/schemas';

export async function generateShopSeo(input: ShopSeoInput): Promise<ShopSeoOutput> {
  return shopSeoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'shopSeoPrompt',
  model: 'googleai/gemini-1.5-flash-preview',
  input: { schema: ShopSeoInputSchema },
  output: { schema: ShopSeoOutputSchema },
  prompt: `You are an SEO expert for e-commerce websites in the transport and logistics industry. 
  
  Based on the following shop details:
  - Shop Name: {{{shopName}}}
  - Shop Description: {{{shopDescription}}}

  Generate the following SEO content:
  1.  A compelling meta title (under 60 characters).
  2.  An engaging meta description (under 160 characters).
  3.  An array of 5 to 7 relevant keywords (tags).

  Return the response in the specified JSON format.`,
});


const shopSeoFlow = ai.defineFlow(
  {
    name: 'shopSeoFlow',
    inputSchema: ShopSeoInputSchema,
    outputSchema: ShopSeoOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
