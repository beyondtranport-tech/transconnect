'use server';
/**
 * @fileOverview An AI agent to find missing contact info for business partners.
 * It is optimized for South African companies and handles cases where the input might be a URL.
 */

import { ai, geminiModel } from '@/ai/genkit';
import { z } from 'zod';
import { googleSearchTool } from '../tools/google-search';

const EnrichPartnerInputSchema = z.object({
  companyName: z.string(),
  contactPerson: z.string().optional(),
});
export type EnrichPartnerInput = z.infer<typeof EnrichPartnerInputSchema>;

const EnrichPartnerOutputSchema = z.object({
  email: z.string().nullable().describe('Found general contact email. Return null if not found.'),
  phone: z.string().nullable().describe('Found primary phone number. Return null if not found.'),
  website: z.string().nullable().describe('Found official company website. Return null if not found.'),
});
export type EnrichPartnerOutput = z.infer<typeof EnrichPartnerOutputSchema>;

export async function enrichPartner(input: EnrichPartnerInput): Promise<EnrichPartnerOutput> {
  return enrichPartnerFlow(input);
}

const enrichPartnerFlow = ai.defineFlow(
  {
    name: 'enrichPartnerFlow',
    inputSchema: EnrichPartnerInputSchema,
    outputSchema: EnrichPartnerOutputSchema,
  },
  async (input) => {
    try {
        console.log(`Enrichment flow started for: "${input.companyName}"`);
        
        const isUrl = input.companyName.startsWith('http') || input.companyName.includes('.co.za') || input.companyName.includes('.com');
        
        const systemPrompt = `You are a South African lead enrichment specialist. Your goal is to find accurate contact details (email, phone, website) for transport and logistics companies.
        
        STRATEGY:
        1. If the input is a URL, search specifically for that domain and look for "Contact Us" or "About" pages.
        2. If the input is a name, search for the name + "South Africa" and "contact details".
        3. Prioritize official websites.
        4. Use local directories like za.maptons.com, brabys.com, or yellowpages.co.za as reliable secondary sources.
        5. Extract the email and phone number even if they are only in the search snippet.
        6. Return null for fields you absolutely cannot verify.`;

        const userPrompt = isUrl 
            ? `Identify the contact details for the website "${input.companyName}". Find the primary email and phone number.`
            : `Research the South African company "${input.companyName}". Find their official website, primary contact email, and phone number. Use the googleSearch tool to look at their site or directory listings like Maptons.`;

        const { output } = await ai.generate({
            model: geminiModel,
            tools: [googleSearchTool],
            system: systemPrompt,
            prompt: userPrompt,
            output: {
                schema: EnrichPartnerOutputSchema
            }
        });
        
        console.log(`Enrichment result for "${input.companyName}":`, output);
        
        return output || { email: null, phone: null, website: null };
    } catch (e: any) {
        console.error("Enrichment Flow Error:", e);
        return { email: null, phone: null, website: null };
    }
  }
);
