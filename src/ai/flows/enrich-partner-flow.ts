'use server';
/**
 * @fileOverview High-intelligence AI research agent for partner contact info.
 * Hardened with Multi-Source Scavenging to prevent null results and ensure 
 * human identity capture for South African industrial entities.
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

        // Parallel deep-search targeting official sites, social platforms, and regional directories
        const [generalResults, socialResults, directoryResults, identityResults] = await Promise.all([
            googleSearchTool({ query: `"${company}" official website contact email South Africa` }),
            googleSearchTool({ query: `"${company}" Facebook page LinkedIn profile mobile number` }),
            googleSearchTool({ query: `"${company}" Yellosa Yandex infoisinfo toprated business profile` }),
            googleSearchTool({ query: `"${company}" South Africa CEO Director Owner name` })
        ]);
        
        const allResults = [
            ...(generalResults || []), 
            ...(socialResults || []), 
            ...(directoryResults || []),
            ...(identityResults || [])
        ];
        
        if (allResults.length === 0) {
            return { email: null, phone: null, mobile: null, website: null, address: null, contactPerson: null, industrial_category: null, minedServiceWording: null };
        }

        const allContent = allResults
            .map(res => `SOURCE: ${res.link}\nTITLE: ${res.title}\nSNIPPET: ${res.snippet}`)
            .join('\n---\n');

        // High-Yield Extraction
        const extraction = await ai.generate({
            model: geminiModel,
            system: `ACT AS AN ELITE INDUSTRIAL FORENSIC INVESTIGATOR.
            Your mission is to aggregate every scrap of verified evidence for "${company}".
            
            EXTRACTION PROTOCOL:
            1. BEST-EFFORT SCAVENGING: If a formal corporate website is missing, you MUST extract phone numbers and emails found in snippets (Facebook, Yellosa, Yandex, LinkedIn).
            2. IDENTITY CAPTURE: Prioritize finding actual human names associated with "Director", "Owner", "MD", or "Branch Manager". Do not return generic roles.
            3. VERBATIM AGGREGATION: In 'minedServiceWording', concatenate the most descriptive technical sentences found in the search results. DO NOT summarize.
            4. ACCURACY: Return data only if it is explicitly associated with "${company}".
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