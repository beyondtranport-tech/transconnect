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
  phone: z.string().nullable().describe('Found primary phone number (e.g., +264 or +27).'),
  website: z.string().nullable().describe('Found official company website URL.'),
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
        const cleanName = input.companyName.trim();
        if (!cleanName) {
            return { email: null, phone: null, website: null, address: null, contactPerson: null };
        }

        console.log(`[ENRICHMENT] Researching: "${cleanName}"`);
        
        // Use a broad search query to maximize chances of finding snippets with contact details
        const query = `${cleanName} contact details email phone address Namibia South Africa`;
        
        const searchResults = await googleSearchTool({ query });
        
        if (!searchResults || searchResults.length === 0) {
            console.warn(`[ENRICHMENT] Zero results found on the web for "${cleanName}"`);
            return { email: null, phone: null, website: null, address: null, contactPerson: null };
        }

        const allSnippets = searchResults
            .map(res => `TITLE: ${res.title}\nLINK: ${res.link}\nSNIPPET: ${res.snippet}`)
            .join('\n---\n');

        // Single Pass Extraction
        const extraction = await ai.generate({
            model: geminiModel,
            system: `You are an expert data extraction agent.
            Analyze the provided search results and extract verifiable contact details for "${cleanName}".
            
            EXTRACTION RULES:
            - EMAILS: Look for email patterns like @outlook.com, @gmail.com, or custom domains.
            - PHONES: Extract numbers with +264 (Namibia) or +27 (South Africa) codes.
            - ADDRESS: Capture the full physical location if present (e.g., Swakopmund, JHB).
            - CONTACT: Look for names mentioned as owner, manager, or primary contact.
            - ACCURACY: Only return data found in the text. DO NOT hallucinate.
            - If details are missing, return null for those fields.`,
            prompt: `SEARCH RESULTS:\n\n${allSnippets}`,
            output: {
                schema: EnrichPartnerOutputSchema
            }
        });
        
        return extraction.output || { email: null, phone: null, website: null, address: null, contactPerson: null };

    } catch (e: any) {
        console.error("[ENRICHMENT] Critical Flow Error:", e);
        throw e;
    }
  }
);
