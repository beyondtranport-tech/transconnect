'use server';
/**
 * @fileOverview An advanced AI research agent to find missing contact info for business partners.
 * Optimized for Southern African companies (ZA, NA, etc.) using iterative searching and snippet scanning.
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
  email: z.string().nullable().describe('Found general contact email. Often appears as @outlook.com, @gmail.com, or @[company].com in snippets.'),
  phone: z.string().nullable().describe('Found primary phone number. Look for international formats (+264, +27) or local patterns (081, 011).'),
  website: z.string().nullable().describe('Found official company website.'),
  address: z.string().nullable().describe('Found physical or postal address.'),
  contactPerson: z.string().nullable().describe('Found name of owner, manager, or contact person.'),
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
        console.log(`[AGENT] Deep Enrichment Agent started for: "${input.companyName}"`);
        
        const systemPrompt = `You are an elite corporate intelligence agent specializing in the Southern African logistics sector. 
        Your objective is to find missing contact details for: "${input.companyName}".
        
        CRITICAL INSTRUCTION:
        1. SNIPPETS ARE VERIFIABLE DATA: Small transporters often do not have a full website. Their contact info (email, phone, address) is almost ALWAYS found in the search result snippets from directories like Yellow Pages, Facebook, or LinkedIn.
        2. BE AGGRESSIVE: Do not return null if a snippet contains a clear phone number or email. Extract it.
        3. MULTI-STEP REASONING:
           - First query should be: "[Company Name] contact details South Africa Namibia"
           - Second query (if needed): "[Company Name] site:facebook.com OR site:linkedin.com"
           - Look for patterns like +264 (Namibia) or +27 (South Africa).
        4. CONTACT PERSONS: Look for names mentioned in snippets as "Manager", "Owner", "Director", or "Operations".
        
        Return ONLY real data found. If a field is missing after multiple searches, return null. DO NOT guess or hallucinate.`;

        const { output } = await ai.generate({
            model: geminiModel,
            tools: [googleSearchTool],
            system: systemPrompt,
            prompt: `Find all missing contact info for: "${input.companyName}". 
            ${input.contactPerson ? `Existing contact reference: ${input.contactPerson}` : ''}
            
            Look specifically for:
            - Official Website
            - Email Address (look for @ symbols in snippets)
            - Phone Number (+264 or +27)
            - Physical Address (e.g., in Swakopmund, JHB, etc.)
            - A specific Contact Person or Owner name.`,
            config: {
                maxSteps: 5,
            },
            output: {
                schema: EnrichPartnerOutputSchema
            }
        });
        
        console.log(`[AGENT] Result for "${input.companyName}":`, output);
        
        return output || { email: null, phone: null, website: null, address: null, contactPerson: null };
    } catch (e: any) {
        console.error("[AGENT] Enrichment Flow Error:", e);
        throw e;
    }
  }
);
