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
    const { text } = await ai.generate({
        model: 'googleai/gemini-1.0-pro',
        prompt: `You are an SEO expert for e-commerce websites in the transport and logistics industry. 
  
        Your output MUST be a valid JSON object with the following keys: "metaTitle" (string, under 60 chars), "metaDescription" (string, under 160 chars), and "tags" (an array of 5-7 relevant string keywords).

        Do NOT include any text, explanation, or markdown formatting before or after the JSON object.

        Based on the following shop details:
        - Shop Name: ${input.shopName}
        - Shop Description: ${input.shopDescription}

        Generate the SEO content and return it in the specified JSON format.`,
    });
    
    try {
        const parsedOutput = JSON.parse(text());
        return ShopSeoOutputSchema.parse(parsedOutput);
    } catch (e) {
        console.error("Failed to parse JSON from AI SEO response:", text());
        // Provide a fallback empty object that matches the schema
        return { metaTitle: '', metaDescription: '', tags: [] };
    }
  }
);
