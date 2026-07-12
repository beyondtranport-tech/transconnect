
'use server';
/**
 * @fileOverview High-fidelity Forensic AI Research Agent.
 * Re-engineered for DUAL-IDENTITY CAPTURE and SITE CONTENT MINING.
 * 
 * Target Persona 1: Marketing Manager (Engagement Lead)
 * Target Persona 2: CEO / Managing Director / Owner
 */

import { ai, geminiModel } from '@/ai/genkit';
import { z } from 'genkit';
import { googleSearchTool } from '../tools/google-search';

const ContactInfoSchema = z.object({
  name: z.string().nullable().describe('Full verified human name.'),
  email: z.string().nullable().describe('Direct professional email address.'),
  mobile: z.string().nullable().describe('Direct mobile number (+27 format).'),
});

const EnrichPartnerInputSchema = z.object({
  companyName: z.string(),
  contactPerson: z.string().optional(),
});
export type EnrichPartnerInput = z.infer<typeof EnrichPartnerInputSchema>;

const EnrichPartnerOutputSchema = z.object({
  email: z.string().nullable().describe('Primary general/professional email.'),
  phone: z.string().nullable().describe('Primary landline.'),
  mobile: z.string().nullable().describe('Primary direct mobile.'),
  website: z.string().nullable().describe('Official corporate domain URL.'),
  address: z.string().nullable().describe('Full verified physical operational address.'),
  industrial_category: z.string().nullable().describe('Refined industrial classification.'),
  minedServiceWording: z.string().nullable().describe('The first 300 words of technical copy extracted from the site pages.'),
  marketingManager: ContactInfoSchema.nullable().describe('Full contact details for the Marketing Manager.'),
  ceo: ContactInfoSchema.nullable().describe('Full contact details for the CEO/MD/Owner.'),
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
            return { email: null, phone: null, mobile: null, website: null, address: null, industrial_category: null, minedServiceWording: null, marketingManager: null, ceo: null };
        }

        // PARALLEL FORENSIC CRAWL
        const [identityResults, webResults, directoryResults] = await Promise.all([
            googleSearchTool({ query: `"${company}" South Africa Marketing Manager CEO Managing Director Owner LinkedIn` }),
            googleSearchTool({ query: `"${company}" official website contact email address South Africa` }),
            googleSearchTool({ query: `"${company}" Yellosa Infoisinfo business profile contact` })
        ]);
        
        const allContent = [...(identityResults || []), ...(webResults || []), ...(directoryResults || [])]
            .map(res => `SOURCE: ${res.link}\nTITLE: ${res.title}\nSNIPPET: ${res.snippet}`)
            .join('\n---\n');

        // HIGH-FIDELITY EXTRACTION
        const extraction = await ai.generate({
            model: geminiModel,
            system: `ACT AS AN ELITE CORPORATE FORENSIC INTELLIGENCE AGENT.
            Your mission is to bridge all data gaps for "${company}" using provided search evidence.
            
            STRICT DUAL-IDENTITY PROTOCOL:
            1. MARKETING MANAGER: You MUST attempt to find the full name, direct email, and mobile for the Marketing Manager or Engagement Lead.
            2. CEO/MD: You MUST attempt to find the full name, direct email, and mobile for the CEO, Managing Director, or Owner.
            3. HIERARCHY: If a specific person is listed as "Head of [Department]", map them to the closest role.

            CONTENT MINING PROTOCOL:
            1. VERBATIM EXTRACTION: In 'minedServiceWording', you MUST provide approximately the first 300 words of technical content found in snippets or titles regarding their services and products. Do NOT summarize. Concatenate the raw evidence.
            2. CONTACT FIDELITY: Prioritize personal corporate emails (e.g. john@company.co.za) over generic aliases.
            3. ADDRESS VERIFICATION: Extract the full verified operational address.
            
            RETURN RAW JSON ONLY.`,
            prompt: `ANALYZE EVIDENCE FOR "${company}":\n\n${allContent}`,
            output: {
                schema: EnrichPartnerOutputSchema
            }
        });
        
        return extraction.output || { email: null, phone: null, mobile: null, website: null, address: null, industrial_category: null, minedServiceWording: null, marketingManager: null, ceo: null };

    } catch (e: any) {
        console.error("[ENRICHMENT_FLOW] Error:", e);
        return { email: null, phone: null, mobile: null, website: null, address: null, industrial_category: null, minedServiceWording: null, marketingManager: null, ceo: null };
    }
  }
);
