'use server';
/**
 * @fileOverview High-speed AI research agent for partner contact info.
 */

import { ai, geminiModel } from '@/ai/genkit';
import { z } from 'genkit';
import { googleSearchTool } from '../tools/google-search';

const EnrichPartnerInputSchema = z.object({
  companyName: z.string(),
  contactPerson: z.string().optional(),
});
export type EnrichPartnerInput = z.infer<typeof EnrichPartnerInputSchema>;

const EnrichPartnerOutputSchema = z.object({
  email: z.string().nullable().describe('Verifiable contact email (e.g. outlook.com, gmail.com, or company domain).'),
  phone: z.string().nullable().describe('Verifiable phone number (look for +264, +27, or local Namibian formats).'),
  website: z.string().nullable().describe('The primary company website URL.'),
  address: z.string().nullable().describe('Full physical address found in snippets or contact pages.'),
  contactPerson: z.string().nullable().describe('Extracted name of the Owner, Manager, or Director (often found in LinkedIn/Facebook snippets).'),
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
            return { email: null, phone: null, website: null, address: null, contactPerson: null };
        }

        // We perform two searches: 
        // 1. General contact info (Likely to hit AI overviews and directories)
        // 2. Social media/Management (Likely to hit Facebook/LinkedIn for names)
        const [generalResults, socialResults] = await Promise.all([
            googleSearchTool({ query: `${company} contact details email phone address Swakopmund Namibia` }),
            googleSearchTool({ query: `${company} owner manager director facebook linkedin` })
        ]);
        
        const allResults = [...(generalResults || []), ...(socialResults || [])];
        
        if (allResults.length === 0) {
            return { email: null, phone: null, website: null, address: null, contactPerson: null };
        }

        const allContent = allResults
            .map(res => `SOURCE: ${res.link}\nTITLE: ${res.title}\nSNIPPET: ${res.snippet}`)
            .join('\n---\n');

        // Extract using LLM pass
        const extraction = await ai.generate({
            model: geminiModel,
            system: `You are a precision research agent specializing in the Southern African logistics sector.
            Analyze all search results for "${company}" and extract verified contact and management details.
            
            CRITICAL RULES:
            1. EXTRACT FROM SNIPPETS: Information in snippets is highly reliable. Look for emails like "namibsroostrp@outlook.com" and numbers like "+264 83...".
            2. MANAGEMENT NAMES: Look for patterns like "Managed by [Name]", "Owner: [Name]", or titles in LinkedIn snippets to find the contact person.
            3. REGIONAL FORMATS: Pay attention to Namibia (+264) and South Africa (+27) formats.
            4. ACCURACY: If a field is absolutely not present, return 'null'. DO NOT hallucinate.`,
            prompt: `EXTRACT DATA FROM THESE RESULTS:\n\n${allContent}`,
            output: {
                schema: EnrichPartnerOutputSchema
            }
        });
        
        return extraction.output || { email: null, phone: null, website: null, address: null, contactPerson: null };

    } catch (e: any) {
        console.error("[ENRICHMENT] Flow Error:", e);
        throw e;
    }
  }
);
