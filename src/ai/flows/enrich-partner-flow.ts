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

        // Use a highly specific "Contact Details" query to trigger rich snippets
        const query = `${company} contact details phone email address owner Namibia South Africa`;
        
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
            system: `You are a precision data extraction agent.
            Analyze the search results for "${company}" and extract contact details.
            
            RULES:
            1. EXTRACT: Email, Phone, Physical Address, and primary Contact Person (Owner/Manager).
            2. SNIPPETS ARE VALID: Information found in snippets is considered verifiable.
            3. PATTERNS: Look for @outlook.com, @gmail.com, or custom domains. Phone codes +264 (NAM) or +27 (SA).
            4. ACCURACY: Return 'null' if a field is not present. DO NOT hallucinate.`,
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
