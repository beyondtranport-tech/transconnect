'use server';
/**
 * @fileOverview An AI-powered SEO metadata generator for shops.
 *
 * - generateShopSeo - A function that generates SEO content for a shop.
 * - GenerateShopSeoInput - The input type for the function.
 * - GenerateShopSeoOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateShopSeoInputSchema = z.object({
  shopName: z.string().describe('The name of the online shop.'),
  shopDescription: z.string().describe('A short description of what the shop sells.'),
});
export type GenerateShopSeoInput = z.infer<typeof GenerateShopSeoInputSchema>;

const GenerateShopSeoOutputSchema = z.object({
  metaTitle: z.string().describe('A compelling, SEO-friendly title, under 60 characters.'),
  metaDescription: z.string().describe('An engaging meta description for search engine results, under 160 characters.'),
  tags: z.array(z.string()).describe('A list of 5-10 relevant keywords or tags for on-site search.'),
});
export type GenerateShopSeoOutput = z.infer<typeof GenerateShopSeoOutputSchema>;


export async function generateShopSeo(input: GenerateShopSeoInput): Promise<GenerateShopSeoOutput> {
  return generateShopSeoFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateShopSeoPrompt',
  input: { schema: GenerateShopSeoInputSchema },
  output: { schema: GenerateShopSeoOutputSchema },
  prompt: `You are a digital marketing expert specializing in e-commerce for industrial and automotive sectors.
  
  Based on the following shop details:
  - Shop Name: {{{shopName}}}
  - Shop Description: {{{shopDescription}}}

  Generate the following SEO metadata:
  1.  **metaTitle**: A compelling, keyword-rich title for search engines. It must be under 60 characters.
  2.  **metaDescription**: An engaging description for search engine result snippets. It must be under 160 characters.
  3.  **tags**: A list of 5 to 10 relevant keywords and phrases that customers might use to find this shop. These should be short and specific.

  Return the result in the specified JSON format.
  `,
});

const generateShopSeoFlow = ai.defineFlow(
  {
    name: 'generateShopSeoFlow',
    inputSchema: GenerateShopSeoInputSchema,
    outputSchema: GenerateShopSeoOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
