'use server';
/**
 * @fileOverview High-fidelity Industrial Research Agent V3.
 * REINSTATED: Proven search strategy and extraction mandate to resolve null returns.
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

    // STABLE SEARCH STRATEGY V3
    // Search 1: Deep Corporate & MD Identification
    const corporateResults = await googleSearchTool({ 
        query: `"${company}" South Africa official website CEO Managing Director email` 
    });
    
    // Search 2: Directory & Social Proof
    const directoryResults = await googleSearchTool({ 
        query: `"${company}" South Africa (LinkedIn OR Yellosa OR Infoisinfo) contact details` 
    });
    
    const allContent = [...(corporateResults || []), ...(directoryResults || [])]
        .map(res => `SOURCE: ${res.link}\nTITLE: ${res.title}\nSNIPPET: ${res.snippet}`)
        .join('\n---\n');

    if (!allContent || allContent.trim().length < 5) {
        return { email: null, phone: null, mobile: null, website: null, address: null, industrial_category: null, minedServiceWording: null, marketingManager: null, ceo: null };
    }

    // EXTRACTION MANDATE V3: Prioritizing data capture over safety defensiveness
    const extraction = await ai.generate({
        model: geminiModel,
        system: `ACT AS AN EXPERT SOUTH AFRICAN INDUSTRIAL RESEARCH AGENT.
        
        GOAL: Extract specific corporate nodes for "${company}".
        PROTOCOL:
        1. WEBSITE: Find the primary corporate URL.
        2. CONTACTS: Identify general and direct (MD/CEO) email and mobile numbers.
        3. PROFILE: Create a 300-word technical summary based on the services described in the snippets.
        
        MANDATE: If data is missing in the evidence, set the field to null. Return RAW JSON only.`,
        prompt: `EXTRACT THE CORPORATE DATA PACK FOR "${company}" FROM THIS EVIDENCE:\n\n${allContent}`,
        output: {
            schema: EnrichPartnerOutputSchema
        }
    });
    
    return extraction.output || { email: null, phone: null, mobile: null, website: null, address: null, industrial_category: null, minedServiceWording: null, marketingManager: null, ceo: null };
  }
);
