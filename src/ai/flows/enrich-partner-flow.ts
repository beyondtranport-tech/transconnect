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
        
        const allContent = [...(identityResults || []), ...(webResults || []), ...(socialResults || []), ...(directoryResults || []).slice(0, 10)]
            .map(res => `SOURCE: ${res.link}\nTITLE: ${res.title}\nSNIPPET: ${res.snippet}`)
            .join('\n---\n');

        // HIGH-FIDELITY EXTRACTION WITH NOISE SUPPRESSION
        const extraction = await ai.generate({
            model: geminiModel,
            system: `ACT AS AN ELITE SOUTH AFRICAN INDUSTRIAL RESEARCH AGENT.
            RETURN ONLY RAW JSON. NO PREAMBLE. NO MARKDOWN. NO CODE BLOCKS.
            
            NOISE SUPPRESSION PROTOCOL:
            1. IGNORE ALL JOB LISTINGS, POLICY NEWS, AND NEWS ARTICLES.
            2. FOCUS ONLY ON CORPORATE LANDING PAGES AND BUSINESS DIRECTORIES.
            3. REGIONAL LOCK: IGNORE RESULTS FOR AUSTRALIA, UK, USA, ETC.
            4. JSON-OR-DIE: IF DATA IS MISSING, RETURN null IN THE JSON. DO NOT EXPLAIN WHY.

            INTEGRITY SHIELD:
            1. REAL DATA ONLY: IF NOT FOUND IN THE EVIDENCE, RETURN null. DO NOT HALLUCINATE.

            SCAVENGER PROTOCOL:
            1. AGGRESSIVE MAPPING: LOOK FOR MOBILE NUMBERS IN SNIPPETS (E.G. 082..., 071...).
            2. DUAL-IDENTITY LOCK: ATTEMPT TO MAP BOTH THE MARKETING MANAGER AND THE CEO/MD.
            3. CONTENT MINING: IN 'minedServiceWording', PROVIDE 300 WORDS OF VERBATIM TECHNICAL CONTENT.`,
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
