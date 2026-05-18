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
        console.log(`Deep Enrichment started for: "${input.companyName}"`);
        
        const systemPrompt = `You are an elite corporate intelligence agent specializing in the African logistics sector. 
        Your objective is to find missing contact details for: "${input.companyName}".
        
        STEP 1: USE THE GOOGLE SEARCH TOOL
        Run multiple specific queries to gather data:
        1. "[Company Name] contact email phone South Africa Namibia"
        2. "[Company Name] Facebook LinkedIn"
        3. "[Company Name] business directory"
        
        STEP 2: SCAN SNIPPETS CAREFULLY
        Many small transporters do not have websites but their info is in search snippets from Facebook or directories. 
        Look for:
        - Email patterns: Any strings containing "@" and ending in .com, .co.za, .com.na, .outlook.com, .gmail.com.
        - Phone patterns: Look for +264 (Namibia) or +27 (SA) followed by digits.
        - Address: Look for phrases like "Plot...", "Street...", "Industrial Area".
        - People: Look for names mentioned as "Owner", "Manager", or "CEO".
        
        STEP 3: EXTRACT & VERIFY
        - Return the most credible data found. 
        - If multiple emails exist, prioritize the one that looks professional or matches the company name.
        - Normalize phone numbers to international format (e.g., +264 ...).
        
        If no data is found for a field, return null. Do not hallucinate.`;

        const { output } = await ai.generate({
            model: geminiModel,
            tools: [googleSearchTool],
            system: systemPrompt,
            prompt: `Find the email, phone, website, physical address, and a key contact person for the company: "${input.companyName}". 
            ${input.contactPerson ? `Existing (possibly incomplete) contact: ${input.contactPerson}` : ''}`,
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
