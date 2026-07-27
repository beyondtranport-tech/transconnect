
'use server';
/**
 * @fileOverview High-fidelity Industrial Research Agent V13.
 * INDUCTIVE RECONSTRUCTION PROTOCOL: Stitches together fragments from multiple sources.
 * SOCIAL-RESILIENT: Prioritizes Facebook and Business Directories if official domains are missing.
 * STAKEHOLDER MANDATE: Extracts CEO, Marketing Lead, Operations Manager, and Technical Manager.
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
  website: z.string().nullable().describe('Official corporate domain or Facebook URL.'),
  address: z.string().nullable().describe('Full verified physical operational address.'),
  industrial_category: z.string().nullable().describe('Refined industrial classification.'),
  minedServiceWording: z.string().nullable().describe('A 300-word technical profile extracted from the website or social content.'),
  marketingManager: ContactInfoSchema.nullable().describe('Full contact details for the Marketing Manager.'),
  operationsManager: ContactInfoSchema.nullable().describe('Full contact details for the Operations Manager.'),
  technicalManager: ContactInfoSchema.nullable().describe('Full contact details for the Technical/Maintenance Manager.'),
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

    // SEARCH STRATEGY V13: INDUCTIVE RECONSTRUCTION (SOCIAL & DIRECTORY INCLUDED)
    const siteResults = await googleSearchTool({ 
        query: `${company} South Africa official website contact management team CEO Operations Technical` 
    });
    
    const teamResults = await googleSearchTool({ 
        query: `${company} South Africa "Operations Manager" OR "Technical Manager" OR "Marketing Manager" LinkedIn` 
    });

    const socialResults = await googleSearchTool({
        query: `${company} South Africa Facebook page contact address email mobile infoisinfo yellosa`
    });

    const allContent = [...(siteResults || []), ...(teamResults || []), ...(socialResults || [])]
        .map(res => `SOURCE: ${res.link}\nTITLE: ${res.title}\nSNIPPET: ${res.snippet}`)
        .join('\n---\n');

    const extraction = await ai.generate({
        model: geminiModel,
        system: `ACT AS AN ELITE SOUTH AFRICAN INDUSTRIAL RESEARCH AGENT (V13 - INDUCTIVE RECONSTRUCTION).
        
        INVESTIGATION MANDATE:
        1. IDENTITY RESOLUTION: Find the names of the CEO, Marketing Lead, Operations Manager, and Technical Manager.
        2. SOCIAL HUB RESILIENCY: Many SA hauliers operate primarily on Facebook. If an official website is missing, you MUST prioritize the Facebook Page Bio and "About" snippets for contact details.
        3. FRAGMENT STITCHING: Combine data from all snippets (Directories, Social, LinkedIn) to eliminate nulls.
        4. EVIDENCE ONLY: Only return data explicitly visible in the snippets.
        
        MANDATE: Return RAW JSON only.`,
        prompt: `PERFORM THE V13 INDUCTIVE HUNT FOR "${company}" USING THIS SEARCH EVIDENCE:\n\n${allContent}`,
        output: {
            schema: EnrichPartnerOutputSchema
        }
    });
    
    return extraction.output || { email: null, phone: null, mobile: null, website: null, address: null, industrial_category: null, minedServiceWording: null, marketingManager: null, operationsManager: null, technicalManager: null, ceo: null };
  }
);
