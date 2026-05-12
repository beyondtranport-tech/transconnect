'use server';
/**
 * @fileOverview An AI-powered SEO content generation flow for shops.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { ShopSeoInputSchema, ShopSeoOutputSchema } from '../schemas';

export type ShopSeoInput = z.infer<typeof MatchFreightInputSchema>;
export type ShopSeoOutput = z.infer<typeof MatchFreightOutputSchema>;


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
            prompt: `You are an SEO expert for e-commerce websites. 
    
            Based on the following shop details:
            - Shop Name: ${input.shopName}
            - Shop Description: ${input.shopDescription}

            Generate the SEO content.`,
            output: {
                schema: ShopSeoOutputSchema
            }
        });
        
        return response.output || { metaTitle: input.shopName, metaDescription: input.shopDescription, tags: [] };
    } catch (e: any) {
        console.error("AI Flow Error in shopSeoFlow:", e);
        return { metaTitle: input.shopName, metaDescription: input.shopDescription, tags: [] };
    }
  }
);
