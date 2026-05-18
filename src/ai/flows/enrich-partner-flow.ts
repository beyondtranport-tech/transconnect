'use server';
/**
 * @fileOverview An AI agent to find missing contact info for business partners.
 * It is optimized for Southern African companies (ZA, NA, etc.) and uses multi-step searching.
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
  email: z.string().nullable().describe('Found general contact email. Return null if not found.'),
  phone: z.string().nullable().describe('Found primary phone number. Return null if not found.'),
  website: z.string().nullable().describe('Found official company website. Return null if not found.'),
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
        console.log(`Enrichment flow started for: "${input.companyName}"`);
        
        // Clean the input to detect if it's already a URL
        const cleanInput = input.companyName.trim().toLowerCase();
        const isUrl = cleanInput.startsWith('http') || cleanInput.includes('.co.za') || (cleanInput.includes('.com') && !cleanInput.includes(' '));
        
        const systemPrompt = `You are a Southern African lead enrichment specialist. Your goal is to find accurate contact details (email, phone, website) for transport and logistics companies, particularly in South Africa and Namibia.
        
        STRATEGY:
        1. FIRST, use the googleSearch tool to find the official website of "${input.companyName}".
        2. SECOND, if a website is found, perform a follow-up search specifically on that domain for "contact us", "about", or "terms" to find verified info.
        3. EXTRACT the primary general email (e.g., info@, sales@, office@) or a person-specific one if found. 
        4. EXTRACT the phone number, including country codes (e.g., +264 for Namibia, +27 for SA).
        5. EXTRACT the official website URL.
        
        Note: If you find an Outlook/Gmail address associated with the company in search snippets, use it. Some transporters use these instead of custom domains.
        Return null for fields you absolutely cannot verify.`;

        const userPrompt = isUrl 
            ? `Perform a deep search on the domain "${cleanInput}" to find the primary email and phone number. Use the googleSearch tool.`
            : `Research the Southern African transport company "${input.companyName}". Find their website first, then find their contact email and phone number. Use the googleSearch tool multiple times if needed.`;

        const { output } = await ai.generate({
            model: geminiModel,
            tools: [googleSearchTool],
            system: systemPrompt,
            prompt: userPrompt,
            output: {
                schema: EnrichPartnerOutputSchema
            }
        });
        
        console.log(`Enrichment result for "${input.companyName}":`, output);
        
        return output || { email: null, phone: null, website: null };
    } catch (e: any) {
        console.error("Enrichment Flow Error:", e);
        return { email: null, phone: null, website: null };
    }
  }
);
