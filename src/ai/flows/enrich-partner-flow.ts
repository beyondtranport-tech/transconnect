'use server';
/**
 * @fileOverview High-fidelity Industrial Research Agent V10.
 * FORENSIC SCAVENGER PROTOCOL: Implements iterative multi-query identity resolution.
 * ANTI-BOUNCE PROTOCOL: Forbids constructed or guessed email addresses.
 * FLAT-SITE RESILIENCE: Handles one-page websites and anchor-based navigation.
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

    // SEARCH STRATEGY V10: FORENSIC SCAVENGER (FLAT-SITE AWARE)
    // Phase 1: Robust Domain Discovery (Trying variants)
    const siteResults = await googleSearchTool({ 
        query: `${company} South Africa official website business info` 
    });
    
    // Phase 2: Sitemap & Section Mining (Looking for names/cards)
    const teamResults = await googleSearchTool({ 
        query: `${company} South Africa "Meet the team" OR "Contact Us" OR "About us" CEO MD Owner` 
    });

    // Phase 3: Identity Resolution (LinkedIn/Facebook Pivot)
    const identityResults = await googleSearchTool({ 
        query: `${company} South Africa CEO MD Marketing LinkedIn profile` 
    });

    // Phase 4: Aggregator Scavenge (Local Directories)
    const directoryResults = await googleSearchTool({
        query: `${company} South Africa phone email address Brabys Yellosa infoisinfo`
    });
    
    const allContent = [...(siteResults || []), ...(teamResults || []), ...(identityResults || []), ...(directoryResults || [])]
        .map(res => `SOURCE: ${res.link}\nTITLE: ${res.title}\nSNIPPET: ${res.snippet}`)
        .join('\n---\n');

    if (!allContent || allContent.trim().length < 5) {
        return { email: null, phone: null, mobile: null, website: null, address: null, industrial_category: null, minedServiceWording: null, marketingManager: null, ceo: null };
    }

    const extraction = await ai.generate({
        model: geminiModel,
        system: `ACT AS AN ELITE SOUTH AFRICAN INDUSTRIAL RESEARCH AGENT (V10 - FORENSIC SCAVENGER).
        
        INVESTIGATION MANDATE:
        1. DOMAIN IDENTIFICATION: Locate the official .co.za or .com domain. 
        2. FLAT-SITE RESILIENCE: Many sites are one-page (flat). You MUST analyze the main page snippets for sections like "Contact", "About", or "Staff Cards" to extract data. Look for anchors (e.g. #contact).
        3. TEAM MINING: Identify the ACTUAL NAMES of the CEO, MD, and Marketing Lead. 
        4. IDENTITY RESOLUTION: Use the identified names to resolve direct professional emails and mobile numbers from LinkedIn or directory snippets.
        5. DIRECTORY SYNC: If the official website is minimal, you MUST use data from Brabys, Yellosa, or LinkedIn to populate the fields.
        
        CRITICAL INTEGRITY SHIELD:
        - NO GUESSING: Never construct email addresses based on common patterns.
        - EVIDENCE ONLY: Only return data explicitly visible in the snippets or metadata.
        - RESOLUTION: If a human name is found, prioritize their specific contact info for the manager/ceo fields.
        
        MANDATE: Return RAW JSON only.`,
        prompt: `PERFORM THE V10 FORENSIC HUNT FOR "${company}" USING THIS SEARCH EVIDENCE:\n\n${allContent}`,
        output: {
            schema: EnrichPartnerOutputSchema
        }
    });
    
    return extraction.output || { email: null, phone: null, mobile: null, website: null, address: null, industrial_category: null, minedServiceWording: null, marketingManager: null, ceo: null };
  }
);
