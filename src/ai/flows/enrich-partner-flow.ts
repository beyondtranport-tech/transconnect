'use server';
/**
 * @fileOverview High-fidelity Industrial Research Agent V4.
 * OPTIMIZED FOR QUOTA PRESERVATION.
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

        // CONSOLIDATED SEARCHES: Reducing from 4 to 2 to stay under burst & daily quotas
        const [corporateResults, socialResults] = await Promise.all([
            googleSearchTool({ query: `"${company}" South Africa official website CEO Managing Director contact email -jobs` }),
            googleSearchTool({ query: `"${company}" South Africa (LinkedIn OR Facebook OR Yellosa) business profile contact mobile` })
        ]);
        
        const allContent = [...(corporateResults || []), ...(socialResults || [])]
            .map(res => `SOURCE: ${res.link}\nTITLE: ${res.title}\nSNIPPET: ${res.snippet}`)
            .join('\n---\n');

        // HIGH-FIDELITY EXTRACTION WITH NOISE SUPPRESSION
        const extraction = await ai.generate({
            model: geminiModel,
            system: `ACT AS AN ELITE SOUTH AFRICAN INDUSTRIAL RESEARCH AGENT.
            RETURN ONLY RAW JSON. NO PREAMBLE. NO MARKDOWN. NO CODE BLOCKS.
            
            NOISE SUPPRESSION: Ignore job listings, news, and international results (Australia/USA).
            INTEGRITY: If data is missing from evidence, return null. DO NOT HALLUCINATE.
            MAPPING: Find mobile numbers (082..., 071...) and direct emails for Marketing and CEO.`,
            prompt: `ANALYZE EVIDENCE FOR "${company}" IN SOUTH AFRICA. RETURN RAW JSON ONLY:\n\n${allContent}`,
            output: {
                schema: EnrichPartnerOutputSchema
            }
        });
        
        return extraction.output || { email: null, phone: null, mobile: null, website: null, address: null, industrial_category: null, minedServiceWording: null, marketingManager: null, ceo: null };

    } catch (e: any) {
        console.error("[RESEARCH_V4] Error:", e);
        // Bubble up quota errors specifically
        if (e.message?.includes('QUOTA') || e.message?.includes('429')) {
            throw e; 
        }
        return { email: null, phone: null, mobile: null, website: null, address: null, industrial_category: null, minedServiceWording: null, marketingManager: null, ceo: null };
    }
  }
);