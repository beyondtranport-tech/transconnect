
'use server';
/**
 * @fileOverview An AI agent to find missing contact info for business partners.
 * It is optimized for Southern African companies (ZA, NA, etc.) and uses multi-step searching.
 */

import { ai, geminiModel } from '@/ai/genkit';
import { z } from 'genkit';
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
        
        // Clean the input
        const companyName = input.companyName.trim();
        
        const systemPrompt = `You are an elite business research agent specializing in the Southern African transport and logistics sector. 
        Your goal is to find accurate contact details (email, phone, website) for the company provided.
        
        SEARCH STRATEGY:
        1. Use the googleSearch tool to search for: "[Company Name] contact email phone website South Africa Namibia".
        2. Inspect the snippets and titles CAREFULLY. Often, small to medium transporters use Outlook or Gmail addresses (e.g., companyname@outlook.com) and these appear directly in the search result snippets.
        3. If no clear email/phone is found in broad results, perform a SECOND search using: "[Company Name] Swakopmund Namibia contact" or similar city-specific variations if a location is hinted at.
        4. If a Facebook page result appears, check its snippet for a phone number or email, as these are often the most current.
        
        EXTRACTION RULES:
        - Extract the email only if it clearly belongs to the company.
        - Normalize phone numbers to include country codes (e.g., +264 for Namibia, +27 for SA).
        - If multiple websites are found, prioritize the one that matches the company name exactly.
        
        Return null for fields you absolutely cannot verify with high confidence.`;

        const userPrompt = `Research and find the primary email, phone number, and official website for the company: "${companyName}". 
        ${input.contactPerson ? `The contact person associated with this company might be ${input.contactPerson}.` : ''}
        
        Use the googleSearch tool to find this information from real-time web data.`;

        const { output } = await ai.generate({
            model: geminiModel,
            tools: [googleSearchTool],
            system: systemPrompt,
            prompt: userPrompt,
            output: {
                schema: EnrichPartnerOutputSchema
            }
        });
        
        console.log(`Enrichment result for "${companyName}":`, output);
        
        return output || { email: null, phone: null, website: null };
    } catch (e: any) {
        console.error("Enrichment Flow Error:", e);
        return { email: null, phone: null, website: null };
    }
  }
);
