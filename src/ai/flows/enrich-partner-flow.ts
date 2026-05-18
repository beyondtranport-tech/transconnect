'use server';
/**
 * @fileOverview High-performance AI research agent for partner contact info.
 * Uses a parallel search strategy to mimic high-quality manual research.
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
  email: z.string().nullable().describe('Verifiable contact email (e.g. outlook.com, gmail.com, or company domain).'),
  phone: z.string().nullable().describe('Verifiable phone number (look for +264, +27, or local formats).'),
  website: z.string().nullable().describe('The primary company website URL.'),
  address: z.string().nullable().describe('Full physical address found in snippets or contact pages.'),
  contactPerson: z.string().nullable().describe('Extracted name of the Owner, Manager, or Director.'),
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

        // Parallel Search Strategy to mimic manual success:
        // 1. General search for contact details
        // 2. Targeted search for owners/managers on social media (Facebook/LinkedIn)
        const [generalResults, socialResults] = await Promise.all([
            googleSearchTool({ query: `${company} contact details phone email` }),
            googleSearchTool({ query: `${company} owner manager facebook linkedin` })
        ]);
        
        const allResults = [...(generalResults || []), ...(socialResults || [])];
        
        if (allResults.length === 0) {
            return { email: null, phone: null, website: null, address: null, contactPerson: null };
        }

        const allContent = allResults
            .map(res => `SOURCE: ${res.link}\nTITLE: ${res.title}\nSNIPPET: ${res.snippet}`)
            .join('\n---\n');

        // Extract using high-intelligence LLM pass
        const extraction = await ai.generate({
            model: geminiModel,
            system: `You are a precision research agent specializing in the logistics sector.
            Analyze search results and extract verified contact and management details.
            
            PRIORITY RULES:
            1. Snippets are highly reliable. Look for emails like "namibsroostrp@outlook.com" and numbers like "+264 83...".
            2. If a field is not present, return 'null'. DO NOT hallucinate.
            3. Prioritize personal names (Owners/Directors) found on Facebook or LinkedIn snippet previews.
            4. If multiple emails exist, prioritize company domain or professional outlook/gmail addresses.`,
            prompt: `ANALYZE RESULTS FOR "${company}":\n\n${allContent}`,
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
