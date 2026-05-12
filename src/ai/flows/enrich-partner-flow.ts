'use server';
/**
 * @fileOverview An AI agent to find missing contact info for business partners.
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
        const { output } = await ai.generate({
            model: geminiModel,
            tools: [googleSearchTool],
            system: "You are a lead enrichment specialist. Your goal is to find accurate contact details for companies in South Africa. Use official websites, Google Business profiles, and local directories like Maptons, Brabys, or Yellow Pages.",
            prompt: `Research the company "${input.companyName}" in South Africa. 
            Find their official website, primary contact email, and phone number. 
            If they don't have a direct website, look for their listing on directory sites. 
            Provide the best available info even if it's partial (e.g., just a phone number). 
            Return null for fields you cannot find.`,
            output: {
                schema: EnrichPartnerOutputSchema
            }
        });
        
        return output || { email: null, phone: null, website: null };
    } catch (e: any) {
        console.error("Enrichment Flow Error:", e);
        return { email: null, phone: null, website: null };
    }
  }
);
