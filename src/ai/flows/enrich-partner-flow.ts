'use server';
/**
 * @fileOverview High-fidelity Industrial Research Agent V4.
 * OPTIMIZED FOR ERROR TRANSPARENCY AND NOISE SUPPRESSION.
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
  phone: z.string().nullable().optional().describe('Primary landline.'),
  mobile: z.string().nullable().optional().describe('Primary direct mobile.'),
  website: z.string().nullable().describe('Official corporate domain URL.'),
  address: z.string().nullable().describe('Full verified physical operational address.'),
  industrial_category: z.string().nullable().describe('Refined industrial classification.'),
  minedServiceWording: z.string().nullable().describe('A 300-word technical profile extracted from the website content.'),
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
    const company = input.companyName.trim();
    if (!company) {
      throw new Error("Company name is required for enrichment.");
    }

    // SEQUENTIAL SEARCHES: We do NOT catch errors here so they bubble up to the API route.
    // This ensures the user sees "SEARCH_QUOTA_EXHAUSTED" or "API_ERROR" instead of nulls.
    
    // Search 1: Corporate & Leadership
    const corporateResults = await googleSearchTool({ 
        query: `"${company}" South Africa official website CEO Managing Director contact email -jobs -hiring -vacancy` 
    });
    
    // Brief pause to satisfy WAFs
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Search 2: Social & Directory Pings
    const socialResults = await googleSearchTool({ 
        query: `"${company}" South Africa (LinkedIn OR Facebook OR Yellosa OR Infoisinfo) business profile contact mobile -jobs` 
    });
    
    const allContent = [...(corporateResults || []), ...(socialResults || [])]
        .map(res => `SOURCE: ${res.link}\nTITLE: ${res.title}\nSNIPPET: ${res.snippet}`)
        .join('\n---\n');

    if (!allContent || allContent.trim().length < 50) {
        // If search returned virtually nothing, we return the null object rather than letting the LLM hallucinate.
        return { email: null, phone: null, mobile: null, website: null, address: null, industrial_category: null, minedServiceWording: null, marketingManager: null, ceo: null };
    }

    // HIGH-FIDELITY EXTRACTION
    const extraction = await ai.generate({
        model: geminiModel,
        system: `ACT AS AN ELITE SOUTH AFRICAN INDUSTRIAL RESEARCH AGENT.
        
        NOISE SUPPRESSION: Strictly ignore job listings, recruitment news, and policy papers.
        DATA INTEGRITY: You MUST find the direct contacts for the Marketing Manager and CEO.
        FORMAT: Return RAW JSON ONLY. No conversation.`,
        prompt: `EXTRACT CORPORATE DATA NODES FOR "${company}" IN SOUTH AFRICA FROM THIS EVIDENCE:\n\n${allContent}`,
        output: {
            schema: EnrichPartnerOutputSchema
        }
    });
    
    return extraction.output || { email: null, phone: null, mobile: null, website: null, address: null, industrial_category: null, minedServiceWording: null, marketingManager: null, ceo: null };
  }
);
