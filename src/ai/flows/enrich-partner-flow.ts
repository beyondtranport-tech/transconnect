'use server';
/**
 * @fileOverview High-intelligence AI research agent for partner contact info.
 * Re-engineered with the "Multi-Source Scavenging" mandate.
 * Implements Hierarchical Identity Capture: Marketing Manager -> CEO/MD/Owner.
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
  email: z.string().nullable().describe('Direct professional email address (Prefer personal over sales/info).'),
  phone: z.string().nullable().describe('Primary office number.'),
  mobile: z.string().nullable().describe('Direct mobile number of the leadership contact.'),
  website: z.string().nullable().describe('Official corporate website URL.'),
  address: z.string().nullable().describe('Physical operational address.'),
  contactPerson: z.string().nullable().describe('Full name of the identified decision maker.'),
  contactTitle: z.string().nullable().describe('The job title of the identified contact.'),
  industrial_category: z.string().nullable().describe('Specific industrial classification.'),
  minedServiceWording: z.string().nullable().describe('Verbatim marketing wording from site hero sections.'),
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
            return { email: null, phone: null, mobile: null, website: null, address: null, contactPerson: null, contactTitle: null, industrial_category: null, minedServiceWording: null };
        }

        // Parallel targeted search for high-fidelity data points
        const [generalResults, leadershipResults, directoryResults] = await Promise.all([
            googleSearchTool({ query: `"${company}" official website contact email South Africa` }),
            googleSearchTool({ query: `"${company}" South Africa Marketing Manager CEO Managing Director Owner LinkedIn` }),
            googleSearchTool({ query: `"${company}" Yellosa Infoisinfo business profile South Africa` })
        ]);
        
        const allResults = [
            ...(generalResults || []), 
            ...(leadershipResults || []), 
            ...(directoryResults || [])
        ];
        
        if (allResults.length === 0) {
            return { email: null, phone: null, mobile: null, website: null, address: null, contactPerson: null, contactTitle: null, industrial_category: null, minedServiceWording: null };
        }

        const allContent = allResults
            .map(res => `SOURCE: ${res.link}\nTITLE: ${res.title}\nSNIPPET: ${res.snippet}`)
            .join('\n---\n');

        // HIGH-YIELD FORENSIC EXTRACTION
        const extraction = await ai.generate({
            model: geminiModel,
            system: `ACT AS AN ELITE INDUSTRIAL FORENSIC INVESTIGATOR.
            Your mission is to bridge data gaps for "${company}" using provided search evidence.
            
            IDENTITY CAPTURE HIERARCHY (STRICT):
            1. PRIMARY TARGET: Find the ACTUAL NAME of the Marketing Manager or Engagement Lead.
            2. FALLBACK: If a Marketing Lead is unavailable, find the Managing Director (MD), CEO, or Owner.
            3. TITLE MAPPING: You MUST return the job title found in 'contactTitle'.

            CONTACT FIDELITY PROTOCOL:
            1. EMAIL SCAVENGING: Aggressively look for professional emails. Prioritize personal corporate addresses (e.g. name@company.co.za) over generic ones (sales@, info@).
            2. MULTI-SOURCE SCAVENGING: If a formal .co.za website is missing, you MUST extract phone numbers and emails found in Facebook snippets or business directories. 
            3. VERBATIM AGGREGATION: In 'minedServiceWording', concatenate the actual technical sentences found in the search results. DO NOT summarize.
            4. CATEGORIZATION: Select the most accurate industrial niche.
            
            RETURN RAW JSON ONLY.`,
            prompt: `ANALYZE EVIDENCE FOR "${company}":\n\n${allContent}`,
            output: {
                schema: EnrichPartnerOutputSchema
            }
        });
        
        return extraction.output || { email: null, phone: null, mobile: null, website: null, address: null, contactPerson: null, contactTitle: null, industrial_category: null, minedServiceWording: null };

    } catch (e: any) {
        console.error("[ENRICHMENT_FLOW] Error:", e);
        return { email: null, phone: null, mobile: null, website: null, address: null, contactPerson: null, contactTitle: null, industrial_category: null, minedServiceWording: null };
    }
  }
);
