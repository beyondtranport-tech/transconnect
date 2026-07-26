'use server';
/**
 * @fileOverview Automated industrial discovery agent V7.
 * Performs high-fidelity extraction of commercial records with mandatory sitemap-to-social leadership mapping.
 * Optimized for South African regional accuracy and broad domain discovery.
 * ANTI-BOUNCE PROTOCOL: Forbids constructed or guessed email addresses.
 */

import { ai, geminiModel } from '@/ai/genkit';
import { z } from 'genkit';
import { googleSearchTool } from '../tools/google-search';

const DiscoveryInputSchema = z.object({
  category: z.string(),
  type: z.enum(['supplier', 'finance', 'transporter', 'driver', 'warehouse', 'distributor']),
  batchSize: z.number().optional().default(30),
});
export type DiscoveryInput = z.infer<typeof DiscoveryInputSchema>;

const ContactSchema = z.object({
    name: z.string().nullable(),
    email: z.string().nullable(),
    mobile: z.string().nullable()
});

const DiscoveryOutputSchema = z.object({
    results: z.array(z.object({
        record_id: z.string(),
        companyName: z.string(),
        industrial_category: z.string(),
        website: z.string().nullable(),
        email: z.string().nullable().describe('General company email.'),
        phone: z.string().nullable().describe('Company landline.'),
        address: z.string().nullable(),
        marketingManager: ContactSchema.nullable(),
        ceo: ContactSchema.nullable(),
        minedServiceWording: z.string().nullable().describe('Verbatim technical profile (approx 300 words).'),
        notes: z.string().optional()
    })).describe('A list of verified professional entities.'),
});
export type DiscoveryOutput = z.infer<typeof DiscoveryOutputSchema>;

export async function runDiscovery(input: DiscoveryInput): Promise<DiscoveryOutput> {
  return discoveryFlow(input);
}

const discoveryFlow = ai.defineFlow(
  {
    name: 'discoveryFlow',
    inputSchema: DiscoveryInputSchema,
    outputSchema: DiscoveryOutputSchema,
  },
  async (input) => {
    try {
        const { category, type, batchSize } = input;
        
        const systemPrompt = `ACT AS AN ELITE SOUTH AFRICAN INDUSTRIAL RESEARCH AGENT (V7 - FORENSIC HUNT).
        RETURN ONLY RAW JSON. NO MARKDOWN. NO CODE BLOCKS. NO PREAMBLE.
        
        REQUIRED INVESTIGATION PROTOCOL PER RECORD:
        1. WEBSITE & SITEMAP: Broaden your search to find the official domain. You MUST crawl the Sitemap, 'About Us', 'Meet the Team', and 'Contact' sub-pages to extract names of the CEO, MD, and Marketing Manager.
        2. IDENTITY RESOLUTION: Use extracted names to perform a targeted SECONDARY search on LinkedIn, Facebook, and Instagram for that specific individual to resolve their direct professional email and mobile numbers.
        3. AGGREGATOR CROSS-REFERENCE: Use local directories (Brabys, Yellosa, Infoisinfo) to bridge any remaining gaps in landlines or general emails.
        
        CRITICAL INTEGRITY SHIELD:
        1. REAL DATA ONLY: DO NOT RETURN MOCK, PLACEHOLDER, OR SYNTHETIC DATA.
        2. NO GUESSING: NEVER construct or "guess" email addresses based on patterns.
        3. VERIFICATION MANDATE: Only return emails/phones explicitly visible in search evidence or metadata.
        
        ID: GENERATE A UNIQUE ID STARTING WITH 'DISC_${type.toUpperCase()}_'.`;

        const response = await ai.generate({
            model: geminiModel,
            tools: [googleSearchTool],
            system: systemPrompt,
            prompt: `EXTRACT ${batchSize} VERIFIED PROFESSIONAL RECORDS FOR ${category} IN SOUTH AFRICA. FOLLOW V7 FORENSIC HUNT PROTOCOL.`,
            output: {
                schema: DiscoveryOutputSchema
            }
        });
        
        return response.output || { results: [] };

    } catch (e: any) {
        console.error("[DISCOVERY_V7] Error:", e);
        throw e;
    }
  }
);
