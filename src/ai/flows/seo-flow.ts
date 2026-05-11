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
import { ShopSeoInputSchema, ShopSeoOutputSchema } from '../schemas';

export type ShopSeoInput = z.infer<typeof ShopSeoInputSchema>;
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
    try {
        const response = await ai.generate({
            model: 'googleai/gemini-1.5-flash',
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
    } catch (e: any) {
        console.error("AI Flow Error in shopSeoFlow:", e);
        return { metaTitle: input.shopName, metaDescription: input.shopDescription, tags: [] };
    }
  }
);
