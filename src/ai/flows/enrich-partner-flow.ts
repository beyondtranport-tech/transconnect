'use server';
/**
 * @fileOverview High-fidelity Industrial Research Agent V12.
 * INDUCTIVE RECONSTRUCTION PROTOCOL: Stitches together fragments from multiple sources.
 * FLAT-SITE RESILIENCE: Specifically optimized for one-page industrial sites.
 * ACRONYM RESOLUTION: Expands initials (e.g. JH) to find official identities.
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

    // SEARCH STRATEGY V12: INDUCTIVE RECONSTRUCTION (ACRONYM & FLAT-SITE AWARE)
    
    // Phase 1: Identity & Acronym Expansion
    const expansionResults = await googleSearchTool({ 
        query: `What does ${company} stand for in South Africa transport? Full legal name` 
    });

    // Phase 2: Robust Domain Discovery
    const siteResults = await googleSearchTool({ 
        query: `${company} South Africa official website full name contact` 
    });
    
    // Phase 3: Sectional & Sitemap Mining
    const teamResults = await googleSearchTool({ 
        query: `${company} South Africa "Meet the team" OR "Contact Cards" OR "About us" CEO MD Owner` 
    });

    // Phase 4: Identity Resolution (LinkedIn/Facebook Pivot)
    const identityResults = await googleSearchTool({ 
        query: `${company} South Africa LinkedIn profile employees management` 
    });

    // Phase 5: Aggregator Scavenge (Local SA Directories - Trustworthy for landlines)
    const directoryResults = await googleSearchTool({
        query: `${company} South Africa Brabys Yellosa infoisinfo address phone`
    });
    
    const allContent = [...(expansionResults || []), ...(siteResults || []), ...(teamResults || []), ...(identityResults || []), ...(directoryResults || [])]
        .map(res => `SOURCE: ${res.link}\nTITLE: ${res.title}\nSNIPPET: ${res.snippet}`)
        .join('\n---\n');

    if (!allContent || allContent.trim().length < 5) {
        return { email: null, phone: null, mobile: null, website: null, address: null, industrial_category: null, minedServiceWording: null, marketingManager: null, ceo: null };
    }

    const extraction = await ai.generate({
        model: geminiModel,
        system: `ACT AS AN ELITE SOUTH AFRICAN INDUSTRIAL RESEARCH AGENT (V12 - INDUCTIVE RECONSTRUCTION).
        
        INVESTIGATION MANDATE (FLAT-SITE & ACRONYM AWARE):
        1. ACRONYM RESOLUTION: You MUST determine if the input name is an acronym (e.g. JH) and identify the full name (e.g. Junior H).
        2. INDUCTIVE STITCHING: You MUST combine data fragments from different snippets. If a phone is in a directory and an email is in a bio, combine them.
        3. FLAT-SITE MINING: Many sites like "jhtrucking.co.za" are one-page. Analyze the snippets for "Contact Cards" and "Footer Blocks" rather than giving up if sub-pages are missing.
        4. IDENTITY RESOLUTION: Find the human names of the CEO and Marketing Lead. Pivot to LinkedIn evidence in the snippets to resolve their direct professional contact.
        
        CRITICAL INTEGRITY SHIELD:
        - EVIDENCE ONLY: Only return data explicitly visible in the snippets.
        - NO GUESSING: Do not construct emails based on patterns.
        
        MANDATE: Return RAW JSON only.`,
        prompt: `PERFORM THE V12 INDUCTIVE HUNT FOR "${company}" USING THIS SEARCH EVIDENCE:\n\n${allContent}`,
        output: {
            schema: EnrichPartnerOutputSchema
        }
    });
    
    return extraction.output || { email: null, phone: null, mobile: null, website: null, address: null, industrial_category: null, minedServiceWording: null, marketingManager: null, ceo: null };
  }
);
