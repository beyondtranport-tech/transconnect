'use server';
/**
 * @fileOverview High-fidelity Industrial Research Agent V4.
 * REINSTATED: Broadened search queries and removed restrictive guards to prevent null returns.
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

    // FUZZY SEARCH STRATEGY: Broadening queries to bypass strict string matching
    
    // Search 1: Corporate & Leadership
    const corporateResults = await googleSearchTool({ 
        query: `${company} South Africa official website CEO Managing Director email -jobs -hiring` 
    });
    
    // Brief pause to satisfy WAFs
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Search 2: Directory & Social Nodes
    const socialResults = await googleSearchTool({ 
        query: `${company} South Africa (LinkedIn OR Yellosa OR Infoisinfo) contact details` 
    });
    
    const allContent = [...(corporateResults || []), ...(socialResults || [])]
        .map(res => `SOURCE: ${res.link}\nTITLE: ${res.title}\nSNIPPET: ${res.snippet}`)
        .join('\n---\n');

    if (!allContent || allContent.trim().length < 5) {
        // Only return nulls if the search tool literally found nothing
        return { email: null, phone: null, mobile: null, website: null, address: null, industrial_category: null, minedServiceWording: null, marketingManager: null, ceo: null };
    }

    // HIGH-FIDELITY EXTRACTION WITH ABSOLUTE JSON MANDATE
    const extraction = await ai.generate({
        model: geminiModel,
        system: `ACT AS AN ELITE INDUSTRIAL RESEARCH AGENT.
        
        GOAL: Extract specific corporate identity nodes.
        NOISE SUPPRESSION: Ignore all job boards, news articles, and "search results" commentary.
        RELIABILITY: If data is missing in evidence, set the field to null. 
        MANDATE: Output RAW JSON ONLY. No preamble. No conversation.`,
        prompt: `EXTRACT CORPORATE DATA NODES FOR "${company}" IN SOUTH AFRICA FROM THIS EVIDENCE:\n\n${allContent}`,
        output: {
            schema: EnrichPartnerOutputSchema
        }
    });
    
    return extraction.output || { email: null, phone: null, mobile: null, website: null, address: null, industrial_category: null, minedServiceWording: null, marketingManager: null, ceo: null };
  }
);
