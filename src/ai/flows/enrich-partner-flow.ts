'use server';
/**
 * @fileOverview High-fidelity Industrial Research Agent V6.
 * DEEP SCAVENGER PROTOCOL: Implements sitemap-to-social identity resolution.
 * ANTI-BOUNCE PROTOCOL: Forbids constructed or guessed email addresses.
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

    // SEARCH STRATEGY V6: DEEP SCAVENGER
    // Search 1: Website, Sitemap & Team Exploration
    const siteResults = await googleSearchTool({ 
        query: `"${company}" South Africa official website sitemap "our team" "contact us"` 
    });
    
    // Search 2: Identity Resolution for CEO & Marketing Manager
    const identityResults = await googleSearchTool({ 
        query: `"${company}" South Africa CEO Managing Director Marketing Manager LinkedIn Facebook` 
    });
    
    const allContent = [...(siteResults || []), ...(identityResults || [])]
        .map(res => `SOURCE: ${res.link}\nTITLE: ${res.title}\nSNIPPET: ${res.snippet}`)
        .join('\n---\n');

    if (!allContent || allContent.trim().length < 5) {
        return { email: null, phone: null, mobile: null, website: null, address: null, industrial_category: null, minedServiceWording: null, marketingManager: null, ceo: null };
    }

    const extraction = await ai.generate({
        model: geminiModel,
        system: `ACT AS AN EXPERT SOUTH AFRICAN INDUSTRIAL RESEARCH AGENT (V6 - DEEP SCAVENGER).
        
        PROTOCOL:
        1. WEBSITE & SITEMAP: Locate official domain. Crawl Sitemap for Team/Contact pages to extract names of CEO and Marketing Lead.
        2. IDENTITY RESOLUTION: Use names to perform targeted social search (LinkedIn/Facebook) to resolve direct emails and mobile numbers.
        3. AGGREGATOR CHECK: Use directories (Yellosa, Brabys) for remaining landlines.
        
        CRITICAL INTEGRITY SHIELD (ANTI-BOUNCE):
        1. NO GUESSING: NEVER construct email addresses based on patterns.
        2. VERIFICATION MANDATE: Only return data explicitly visible in search evidence. If not found, return null.
        
        MANDATE: Return RAW JSON only.`,
        prompt: `EXTRACT THE FORENSIC DATA PACK FOR "${company}" FROM THIS EVIDENCE:\n\n${allContent}`,
        output: {
            schema: EnrichPartnerOutputSchema
        }
    });
    
    return extraction.output || { email: null, phone: null, mobile: null, website: null, address: null, industrial_category: null, minedServiceWording: null, marketingManager: null, ceo: null };
  }
);
