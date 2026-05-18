'use server';
/**
 * @fileOverview High-performance AI research agent to find missing contact info for business partners.
 * Uses a "Gather & Extract" pattern to avoid agent-loop timeouts while maximizing snippet scanning.
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
  email: z.string().nullable().describe('Found general contact email (e.g., namibsroostrp@outlook.com).'),
  phone: z.string().nullable().describe('Found primary phone number (+264 or +27).'),
  website: z.string().nullable().describe('Found official company website.'),
  address: z.string().nullable().describe('Found physical or postal address (e.g. Swakop River Plots).'),
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
        console.log(`[ENRICHMENT] Starting high-speed research for: "${input.companyName}"`);
        
        // STEP 1: Generate targeted search queries
        const queryResponse = await ai.generate({
            model: geminiModel,
            system: "You are a research strategist. Generate 3 specific search queries to find contact details (email, phone, address, owner name) for a transport company.",
            prompt: `Company: "${input.companyName}" ${input.contactPerson ? `Contact Reference: ${input.contactPerson}` : ''}`,
            output: {
                schema: z.object({
                    queries: z.array(z.string()).length(3)
                })
            }
        });

        const queries = queryResponse.output?.queries || [
            `${input.companyName} contact details South Africa Namibia`,
            `${input.companyName} site:facebook.com OR site:linkedin.com`,
            `${input.companyName} phone number email address`
        ];

        // STEP 2: Execute searches and gather all snippets
        console.log(`[ENRICHMENT] Executing queries:`, queries);
        const searchPromises = queries.map(q => googleSearchTool({ query: q }));
        const searchResults = await Promise.all(searchPromises);
        const allSnippets = searchResults.flat().map(res => `TITLE: ${res.title}\nLINK: ${res.link}\nSNIPPET: ${res.snippet}`).join('\n---\n');

        if (!allSnippets.trim()) {
            console.warn(`[ENRICHMENT] No search results returned for "${input.companyName}"`);
            return { email: null, phone: null, website: null, address: null, contactPerson: null };
        }

        // STEP 3: Extract structured data from all gathered snippets
        console.log(`[ENRICHMENT] Extracting data from gathered results...`);
        const extraction = await ai.generate({
            model: geminiModel,
            system: `You are an expert data extraction agent. 
            Analyze the provided search results and extract verifiable contact details.
            
            CRITICAL INSTRUCTIONS:
            1. SNIPPETS ARE PRIMARY SOURCES: Small companies often don't have websites. Extract emails and phones found in Facebook, LinkedIn, or directory snippets.
            2. EMAIL PATTERNS: Look specifically for @outlook.com, @gmail.com, or @[company].com.
            3. PHONE PATTERNS: Look for +264 (Namibia) or +27 (South Africa) formats.
            4. ADDRESSES: Look for plot numbers, street names, or city markers like "Swakopmund" or "JHB".
            5. NAMES: Look for "Owner", "Director", "Manager", or "Operations" mentions.
            
            Return null for fields where NO verifiable data is found. DO NOT GUESS.`,
            prompt: `GATHERED SEARCH DATA FOR "${input.companyName}":\n\n${allSnippets}`,
            output: {
                schema: EnrichPartnerOutputSchema
            }
        });
        
        console.log(`[ENRICHMENT] Result for "${input.companyName}":`, extraction.output);
        return extraction.output || { email: null, phone: null, website: null, address: null, contactPerson: null };

    } catch (e: any) {
        console.error("[ENRICHMENT] Critical Flow Error:", e);
        throw e;
    }
  }
);
