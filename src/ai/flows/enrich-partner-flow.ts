
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
  email: z.string().email().nullable().describe('Found general contact email.'),
  phone: z.string().nullable().describe('Found primary phone number.'),
  website: z.string().url().nullable().describe('Found official company website.'),
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
            system: "You are a contact research expert. Find accurate company details.",
            prompt: `Find the general contact email, phone, and website for the company "${input.companyName}"${input.contactPerson ? ` (Contact person: ${input.contactPerson})` : ''}. Only return information from search results.`,
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
