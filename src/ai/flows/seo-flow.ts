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

const ShopSeoInputSchema = z.object({
  shopName: z.string().describe('The name of the online shop.'),
  shopDescription: z.string().describe('A brief description of the shop and what it sells.'),
});
export type ShopSeoInput = z.infer<typeof ShopSeoInputSchema>;

const ShopSeoOutputSchema = z.object({
    metaTitle: z.string().describe('An SEO-optimized title for the shop page, under 60 characters.'),
    metaDescription: z.string().describe('An SEO-optimized meta description, under 160 characters.'),
    tags: z.array(z.string()).describe('A list of 5-7 relevant SEO keywords or tags for the shop.'),
});
export type ShopSeoOutput = z.infer<typeof ShopSeoOutputSchema>;


export async function generateShopSeo(input: ShopSeoInput): Promise<ShopSeoOutput> {
  return shopSeoFlow(input);
}

const shopSeoFlow = ai.defineFlow(
  {
    name: 'shopSeoFlow',
    inputSchema: ShopSeoInputSchema,
    outputSchema: ShopSeoOutputSchema,
  },
  async (input: ShopSeoInput) => {
    const response = await ai.generate({
        model: 'gemini-1.5-flash',
        prompt: `You are an SEO expert for e-commerce websites in the transport and logistics industry. 
  
        Based on the following shop details:
        - Shop Name: ${input.shopName}
        - Shop Description: ${input.shopDescription}

        Generate the SEO content.`,
        output: {
            schema: ShopSeoOutputSchema
        }
    });
    
    return response.output || { metaTitle: '', metaDescription: '', tags: [] };
  }
);
