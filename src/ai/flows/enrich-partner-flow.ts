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
  email: z.string().nullable().describe('Found general contact email. Often appears as @outlook.com or @gmail.com in snippets.'),
  phone: z.string().nullable().describe('Found primary phone number. Look for international formats (+264, +27).'),
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
        console.log(`Deep Enrichment Agent started for: "${input.companyName}"`);
        
        const systemPrompt = `You are an elite corporate intelligence agent specializing in the Southern African logistics sector. 
        Your objective is to find missing contact details for: "${input.companyName}".
        
        STEP 1: USE THE GOOGLE SEARCH TOOL
        Perform multiple, targeted queries to find the most accurate data:
        1. "[Company Name] contact email phone South Africa Namibia"
        2. "[Company Name] site:facebook.com OR site:linkedin.com"
        3. "[Company Name] site:yellowpages.co.za OR site:yellowpages.co.na"
        
        STEP 2: DEEP SCAN SNIPPETS
        Small transporters rarely have dedicated websites. Their info is often in directory or social media snippets.
        YOU MUST extract:
        - Emails: Look for any string with "@" (e.g. namibsroostrp@outlook.com).
        - Phones: Look for +264, +27, or local patterns like 081, 083, 011.
        - People: Names associated with "Owner", "Director", "Manager".
        
        STEP 3: MULTI-STEP REASONING
        If you find a website but no email in the snippet, perform a follow-up search for "[Company Name] website contact email".
        
        Return ONLY real data found. If a field is missing, return null. DO NOT guess or hallucinate.`;

        const { output } = await ai.generate({
            model: geminiModel,
            tools: [googleSearchTool],
            system: systemPrompt,
            prompt: `Find contact info for: "${input.companyName}". 
            ${input.contactPerson ? `Existing contact reference: ${input.contactPerson}` : ''}`,
            config: {
                maxSteps: 5, // CRITICAL: Allows the model to perform multiple searches in sequence
            },
            output: {
                schema: EnrichPartnerOutputSchema
            }
        });
        
        console.log(`Enrichment result for "${input.companyName}":`, output);
        
        return output || { email: null, phone: null, website: null, address: null, contactPerson: null };
    } catch (e: any) {
        console.error("Enrichment Flow Error:", e);
        return { email: null, phone: null, website: null, address: null, contactPerson: null };
    }
  }
);
