'use server';
/**
 * @fileOverview An AI-powered SEO content generation flow for shops.
 *
 * - generateShopSeo - A function that creates SEO content based on shop details.
 * - ShopSeoInput - The input type for the generateShopSeo function.
 * - ShopSeoOutput - The return type for the generateShopSeo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const ShopSeoInputSchema = z.object({
  shopName: z.string().describe('The name of the online shop.'),
  shopDescription: z.string().describe('A brief description of the shop and what it sells.'),
});
export type ShopSeoInput = z.infer<typeof ShopSeoInputSchema>;

export const ShopSeoOutputSchema = z.object({
    metaTitle: z.string().describe('An SEO-optimized title for the shop page, under 60 characters.'),
    metaDescription: z.string().describe('An SEO-optimized meta description, under 160 characters.'),
    tags: z.array(z.string()).describe('A list of 5-7 relevant SEO keywords or tags for the shop.'),
});
export type ShopSeoOutput = z.infer<typeof ShopSeoOutputSchema>;

export async function generateShopSeo(input: ShopSeoInput): Promise<ShopSeoOutput> {
  return shopSeoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'shopSeoPrompt',
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
