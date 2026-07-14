'use server';
/**
 * @fileOverview High-fidelity Industrial Research Agent V4.
 * RE-ENGINEERED FOR NOISE SUPPRESSION & RSA REGIONAL LOCK.
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

        // CLINICAL TARGETED CRAWL: Focusing on corporate nodes, avoiding news/jobs noise
        const [identityResults, webResults, socialResults, directoryResults] = await Promise.all([
            googleSearchTool({ query: `"${company}" South Africa CEO Managing Director LinkedIn -jobs -hiring` }),
            googleSearchTool({ query: `"${company}" South Africa official website contact email address` }),
            googleSearchTool({ query: `site:facebook.com "${company}" South Africa "contact us" email mobile` }),
            googleSearchTool({ query: `"${company}" South Africa (Yellosa OR Infoisinfo OR Braby) business profile` })
        ]);
        
        const allContent = [...(identityResults || []), ...(webResults || []), ...(socialResults || []), ...(directoryResults || [])]
            .map(res => `SOURCE: ${res.link}\nTITLE: ${res.title}\nSNIPPET: ${res.snippet}`)
            .join('\n---\n');

        // HIGH-FIDELITY EXTRACTION WITH NOISE SUPPRESSION
        const extraction = await ai.generate({
            model: geminiModel,
            system: `ACT AS AN ELITE SOUTH AFRICAN INDUSTRIAL RESEARCH AGENT.
            Your mission is to find CORPORATE DATA nodes for "${company}" in South Africa.
            
            NOISE SUPPRESSION PROTOCOL:
            1. IGNORE all search results related to "Forensic Jobs", "Data Analyst roles", "AI Policies", or "News Articles".
            2. FOCUS ONLY on Corporate Landing Pages, LinkedIn People Profiles, and Facebook Business Pages.
            3. REGIONAL LOCK: You MUST ignore results for entities in Australia, UK, USA, etc.

            INTEGRITY SHIELD:
            1. REAL DATA ONLY: If information is not found in the evidence, return null. DO NOT hallucinate.
            2. JSON ONLY: Return ONLY the raw JSON object. Do not provide conversational filler or a list of search results.

            SCAVENGER PROTOCOL:
            1. AGGRESSIVE MAPPING: Look for mobile numbers in snippets (e.g. 082..., 071...).
            2. DUAL-IDENTITY LOCK: You MUST attempt to map both the Marketing Manager and the CEO/MD.
            3. CONTENT MINING: In 'minedServiceWording', provide 300 words of VERBATIM technical content regarding their services.`,
            prompt: `ANALYZE EVIDENCE FOR "${company}" IN SOUTH AFRICA. RETURN RAW JSON ONLY. BRIDGE ALL GAPS:\n\n${allContent}`,
            output: {
                schema: EnrichPartnerOutputSchema
            }
        });
        
        return extraction.output || { email: null, phone: null, mobile: null, website: null, address: null, industrial_category: null, minedServiceWording: null, marketingManager: null, ceo: null };

    } catch (e: any) {
        console.error("[RESEARCH_V4] Error:", e);
        return { email: null, phone: null, mobile: null, website: null, address: null, industrial_category: null, minedServiceWording: null, marketingManager: null, ceo: null };
    }
  }
);