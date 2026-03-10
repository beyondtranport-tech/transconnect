
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

const shopSeoFlow = ai.defineFlow(
  {
    name: 'shopSeoFlow',
    inputSchema: ShopSeoInputSchema,
    outputSchema: ShopSeoOutputSchema,
  },
  async (input) => {
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
