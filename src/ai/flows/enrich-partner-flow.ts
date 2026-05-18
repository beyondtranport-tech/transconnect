'use server';
/**
 * @fileOverview Ultra-fast AI research agent for partner contact info.
 * Consolidated into a single LLM pass to prevent server-side timeouts.
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
  email: z.string().nullable().describe('Found general contact email (e.g., info@company.com or outlook.com).'),
  phone: z.string().nullable().describe('Found primary phone number (+264 or +27).'),
  website: z.string().nullable().describe('Found official company website.'),
  address: z.string().nullable().describe('Found physical or postal address.'),
  contactPerson: z.string().nullable().describe('Found name of owner, manager, or director.'),
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
        console.log(`[ENRICHMENT] Starting ultra-fast research for: "${input.companyName}"`);
        
        // STEP 1: Construct a highly-targeted query immediately
        // Skipping LLM query generation saves ~5-10 seconds of round-trip latency.
        const query = `"${input.companyName}" contact details email phone address "South Africa" "Namibia"`;
        
        // STEP 2: Execute search
        console.log(`[ENRICHMENT] Searching: ${query}`);
        const searchResults = await googleSearchTool({ query });
        
        const allSnippets = searchResults
            .map(res => `TITLE: ${res.title}\nSNIPPET: ${res.snippet}`)
            .join('\n---\n');

        if (!allSnippets.trim()) {
            console.warn(`[ENRICHMENT] Zero web results for "${input.companyName}"`);
            return { email: null, phone: null, website: null, address: null, contactPerson: null };
        }

        // STEP 3: Single LLM Extraction Pass
        // We feed all search results to the LLM once to extract structured data.
        console.log(`[ENRICHMENT] Extracting data from search results...`);
        const extraction = await ai.generate({
            model: geminiModel,
            system: `You are an expert data extraction agent for Southern African business listings. 
            Analyze the provided search results and extract verifiable contact details.
            
            CRITICAL EXTRACTION GUIDELINES:
            - EMAILS: Look for patterns like @outlook.com, @gmail.com, or official company domains.
            - PHONES: Capture +264 (Namibia) or +27 (South Africa) numbers.
            - ACCURACY: Only return data explicitly found in the snippets. DO NOT hallucinate.
            - FALLBACK: If multiple values exist, choose the most professional or recent one.`,
            prompt: `SEARCH RESULTS FOR "${input.companyName}":\n\n${allSnippets}`,
            output: {
                schema: EnrichPartnerOutputSchema
            }
        });
        
        console.log(`[ENRICHMENT] Extraction result for "${input.companyName}":`, extraction.output);
        return extraction.output || { email: null, phone: null, website: null, address: null, contactPerson: null };

    } catch (e: any) {
        console.error("[ENRICHMENT] Critical Flow Error:", e);
        throw e;
    }
  }
);
