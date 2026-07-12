'use server';
/**
 * @fileOverview High-intelligence AI research agent for partner contact info.
 * Reverted to high-success scavenging model.
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
  phone: z.string().nullable().describe('Verifiable landline number.'),
  mobile: z.string().nullable().describe('Verifiable direct mobile number.'),
  website: z.string().nullable().describe('The primary company website URL.'),
  address: z.string().nullable().describe('Full physical address.'),
  contactPerson: z.string().nullable().describe('Extracted name of the Owner or Director.'),
  industrial_category: z.string().nullable().describe('Specific industrial classification.'),
  minedServiceWording: z.string().nullable().describe('Verbatim text from site hero sections.'),
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
            return { email: null, phone: null, mobile: null, website: null, address: null, contactPerson: null, industrial_category: null, minedServiceWording: null };
        }

        // Broadened search query targeting social and directory evidence
        const [generalResults, socialResults, directoryResults] = await Promise.all([
            googleSearchTool({ query: `"${company}" contact email phone location South Africa` }),
            googleSearchTool({ query: `"${company}" Facebook page LinkedIn profile South Africa` }),
            googleSearchTool({ query: `"${company}" Yandex Yellosa infoisinfo toprated profile` })
        ]);
        
        const allResults = [...(generalResults || []), ...(socialResults || []), ...(directoryResults || [])];
        
        if (allResults.length === 0) {
            return { email: null, phone: null, mobile: null, website: null, address: null, contactPerson: null, industrial_category: null, minedServiceWording: null };
        }

        const allContent = allResults
            .map(res => `SOURCE: ${res.link}\nTITLE: ${res.title}\nSNIPPET: ${res.snippet}`)
            .join('\n---\n');

        // Extract using high-intelligence LLM pass
        const extraction = await ai.generate({
            model: geminiModel,
            system: `ACT AS AN ELITE INDUSTRIAL FORENSIC INVESTIGATOR.
            Analyze search results and extract verified contact and management details for "${company}".
            
            EXTRACTOR RULES:
            1. MULTI-SOURCE EVIDENCE: Snippets from Facebook and directories are highly reliable. Prioritize discovered info even if a formal site is absent.
            2. IDENTITY FIRST: Look for personal names associated with "Owner", "Manager", or "Lead".
            3. VERBATIM MINING: In 'minedServiceWording', concatenate the most descriptive technical sentences found in the snippets.
            4. INDUSTRIAL CLASSIFICATION: Deduce the specific niche (e.g. Injectors, Auto Electrical, Logistics).
            5. RETURN RAW JSON ONLY.`,
            prompt: `ANALYZE SEARCH RESULTS FOR "${company}":\n\n${allContent}`,
            output: {
                schema: EnrichPartnerOutputSchema
            }
        });
        
        return extraction.output || { email: null, phone: null, mobile: null, website: null, address: null, contactPerson: null, industrial_category: null, minedServiceWording: null };

    } catch (e: any) {
        console.error("[ENRICHMENT] Flow Error:", e);
        return { email: null, phone: null, mobile: null, website: null, address: null, contactPerson: null, industrial_category: null, minedServiceWording: null };
    }
  }
);
