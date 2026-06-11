'use server';
/**
 * @fileOverview High-intelligence AI research agent for partner contact info.
 * Optimized to handle restricted search environments.
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
  phone: z.string().nullable().describe('Verifiable landline number.'),
  mobile: z.string().nullable().describe('Verifiable direct mobile number (look for +27 7, +27 8, etc).'),
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
            return { email: null, phone: null, mobile: null, website: null, address: null, contactPerson: null };
        }

        // Broadened search query targeting the new whitelist domains
        const [generalResults, directoryResults, leadershipResults] = await Promise.all([
            googleSearchTool({ query: `"${company}" contact email phone location South Africa` }),
            googleSearchTool({ query: `"${company}" Yep infoisinfo toprated yellosa profile` }),
            googleSearchTool({ query: `"${company}" director owner LinkedIn Facebook` })
        ]);
        
        const allResults = [
            ...(generalResults || []), 
            ...(directoryResults || []), 
            ...(leadershipResults || [])
        ];
        
        if (allResults.length === 0) {
            return { email: null, phone: null, mobile: null, website: null, address: null, contactPerson: null };
        }

        const allContent = allResults
            .map(res => `SOURCE: ${res.link}\nTITLE: ${res.title}\nSNIPPET: ${res.snippet}`)
            .join('\n---\n');

        // Extract using high-intelligence LLM pass
        const extraction = await ai.generate({
            model: geminiModel,
            system: `You are a forensic research agent for the South African transport industry.
            Analyze search results and extract verified contact and management details for "${company}".
            
            EXTRACTOR RULES:
            1. Snippets are highly reliable. Look for emails and local phone formats.
            2. DISTINGUISH CONTACTS: If you find a cell number (+27 7 or +27 8), map it to 'mobile'. Landlines (011, 021, etc) go to 'phone'.
            3. If a field is not present, return 'null'. DO NOT hallucinate.
            4. Prioritize personal names found on social snippet previews or "About" pages.
            5. RETURN RAW JSON ONLY.`,
            prompt: `ANALYZE SEARCH RESULTS FOR "${company}":\n\n${allContent}`,
            output: {
                schema: EnrichPartnerOutputSchema
            }
        });
        
        return extraction.output || { email: null, phone: null, mobile: null, website: null, address: null, contactPerson: null };

    } catch (e: any) {
        console.error("[ENRICHMENT] Flow Error:", e);
        // Return null data instead of crashing the UI
        return { email: null, phone: null, mobile: null, website: null, address: null, contactPerson: null };
    }
  }
);
