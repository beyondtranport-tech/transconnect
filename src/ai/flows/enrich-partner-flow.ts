'use server';
/**
 * @fileOverview High-speed AI research agent for partner contact info.
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
  email: z.string().nullable().describe('Verifiable contact email.'),
  phone: z.string().nullable().describe('Verifiable phone number (+264 or +27).'),
  website: z.string().nullable().describe('Found company website URL.'),
  address: z.string().nullable().describe('Found physical address.'),
  contactPerson: z.string().nullable().describe('Owner, Manager, or Director name.'),
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
        const company = input.companyName.trim();
        if (!company) {
            return { email: null, phone: null, website: null, address: null, contactPerson: null };
        }

        // Broader, more organic query to ensure we catch common directory snippets
        const query = `"${company}" contact email phone address Namibia South Africa`;
        
        const searchResults = await googleSearchTool({ query });
        
        if (!searchResults || searchResults.length === 0) {
            return { email: null, phone: null, website: null, address: null, contactPerson: null };
        }

        const allContent = searchResults
            .map(res => `SOURCE: ${res.link}\nTITLE: ${res.title}\nSNIPPET: ${res.snippet}`)
            .join('\n---\n');

        // Extract using LLM pass
        const extraction = await ai.generate({
            model: geminiModel,
            system: `You are a precision data extraction agent specializing in the Southern African logistics sector.
            Analyze the provided search results for "${company}" and extract verified contact details.
            
            CRITICAL RULES:
            1. SNIPPETS ARE PRIMARY: Many small African transporters only appear in directory snippets. Information found in a snippet is considered verifiable.
            2. PATTERNS TO WATCH FOR: 
               - Emails: @outlook.com, @gmail.com, or custom business domains.
               - Phone: Country codes +264 (Namibia) or +27 (South Africa).
               - Location: Look for clues like "Swakop River Plots", "Swakopmund", or "Johannesburg".
            3. CONTACT PERSON: Extract the names of owners, managers, or directors if mentioned in snippets.
            4. ACCURACY: If a field is absolutely not present, return 'null'. DO NOT hallucinate.`,
            prompt: `EXTRACT DATA FROM THESE RESULTS:\n\n${allContent}`,
            output: {
                schema: EnrichPartnerOutputSchema
            }
        });
        
        return extraction.output || { email: null, phone: null, website: null, address: null, contactPerson: null };

    } catch (e: any) {
        console.error("[ENRICHMENT] Flow Error:", e);
        throw e;
    }
  }
);
