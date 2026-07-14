'use server';
/**
 * @fileOverview High-fidelity Forensic AI Research Agent V4.
 * RE-ENGINEERED FOR AGGRESSIVE SCAVENGING & RSA REGIONAL LOCK.
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

        // AGGRESSIVE MULTI-CHANNEL CRAWL WITH RSA LOCK
        const [identityResults, webResults, socialResults, directoryResults] = await Promise.all([
            googleSearchTool({ query: `"${company}" South Africa Marketing Manager CEO Managing Director Owner LinkedIn` }),
            googleSearchTool({ query: `"${company}" official website contact email address South Africa` }),
            googleSearchTool({ query: `site:facebook.com "${company}" South Africa contact email mobile` }),
            googleSearchTool({ query: `"${company}" Yellosa Infoisinfo Braby business profile contact South Africa` })
        ]);
        
        const allContent = [...(identityResults || []), ...(webResults || []), ...(socialResults || []), ...(directoryResults || [])]
            .map(res => `SOURCE: ${res.link}\nTITLE: ${res.title}\nSNIPPET: ${res.snippet}`)
            .join('\n---\n');

        // HIGH-FIDELITY EXTRACTION WITH SCAVENGER MANDATE
        const extraction = await ai.generate({
            model: geminiModel,
            system: `ACT AS AN ELITE SOUTH AFRICAN CORPORATE FORENSIC INTELLIGENCE AGENT.
            Your mission is to bridge all data gaps for the SOUTH AFRICAN entity of "${company}" using provided search evidence.
            
            CRITICAL INTEGRITY SHIELD:
            1. REAL DATA ONLY: You are STRICTLY FORBIDDEN from returning mock, synthetic, or placeholder data. If information is not found in the evidence, return null.
            2. NO HALLUCINATION: Do not invent names or emails. Accuracy is more valuable than completeness.
            3. REGIONAL LOCK: You MUST ignore all results for entities in Australia, UK, USA, or other countries.

            SCAVENGER PROTOCOL:
            1. AGGRESSIVE MAPPING: Look for patterns in snippets. If you find a CEO name and a general email, try to infer the direct email format if enough evidence exists across multiple sources.
            2. SOCIAL MINING: Facebook snippets often contain mobile numbers and "Call Now" buttons. LinkedIn snippets often name the MD or Marketing Manager. Scavenge these specifically.
            3. DUAL-IDENTITY LOCK: You MUST attempt to map both the Marketing Manager (Engagement Lead) and the CEO/MD (Principal).

            CONTENT MINING PROTOCOL:
            1. TECHNICAL PROFILE: In 'minedServiceWording', provide approx 300 words of VERBATIM technical content found in snippets regarding their services.
            2. LANDLINE RECOVERY: Prioritize verified company landlines for the 'phone' field from directory sites like Yellosa.

            RETURN RAW JSON ONLY.`,
            prompt: `ANALYZE EVIDENCE FOR "${company}" IN SOUTH AFRICA. BRIDGE ALL GAPS:\n\n${allContent}`,
            output: {
                schema: EnrichPartnerOutputSchema
            }
        });
        
        return extraction.output || { email: null, phone: null, mobile: null, website: null, address: null, industrial_category: null, minedServiceWording: null, marketingManager: null, ceo: null };

    } catch (e: any) {
        console.error("[FORENSIC_V4] Error:", e);
        return { email: null, phone: null, mobile: null, website: null, address: null, industrial_category: null, minedServiceWording: null, marketingManager: null, ceo: null };
    }
  }
);