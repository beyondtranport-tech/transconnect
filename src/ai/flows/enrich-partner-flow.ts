
'use server';
/**
 * @fileOverview An AI agent to find missing contact info for business partners.
 */

import { ai, geminiModel } from '@/ai/genkit';
import { z } from 'zod'; // Standard zod for flow definition
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
            system: "You are a South African lead enrichment specialist. Your goal is to find accurate contact details for transport and logistics companies. Use official websites, Google Business profiles, and local directories like Maptons (za.maptons.com), Brabys, or Yellow Pages (yellowpages.co.za). Prioritize finding a specific person's email if possible, otherwise return the general info@ or sales@ address.",
            prompt: `Research the South African company "${input.companyName}". 
            Find their official website, primary contact email, and phone number. 
            If they don't have a direct website, look for their listing on Maptons, Brabys, or other SA business directories. 
            Provide the best available info even if it's partial. 
            Return null ONLY for fields you absolutely cannot find.`,
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
