'use server';
/**
 * @fileOverview Automated industrial discovery agent V11.
 * Performs high-fidelity extraction with mandatory sitemap-to-social leadership mapping.
 * FLAT-SITE RESILIENT: Specifically optimized for one-page industrial websites.
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
        
        const systemPrompt = `ACT AS AN ELITE SOUTH AFRICAN INDUSTRIAL RESEARCH AGENT (V11 - FORENSIC HUNT).
        RETURN ONLY RAW JSON. NO MARKDOWN. NO CODE BLOCKS. NO PREAMBLE.
        
        REQUIRED INVESTIGATION PROTOCOL PER RECORD:
        1. BROAD DISCOVERY: Use broad queries to identify official domains and directory listings. Try name variants and acronym expansions.
        2. FLAT-SITE ANALYSIS: Many sites are one-page with "Contact Us" cards. Analyze the root snippets for these specific blocks and anchors.
        3. TEAM MINING: Identify the CEO and Marketing Manager by name from "About Us", "Team", or "Contact" sections/cards.
        4. IDENTITY RESOLUTION: Perform secondary targeted searches on LinkedIn and Facebook for identified names to resolve direct professional emails and mobile numbers.
        5. AGGREGATOR SYNC: Use local directories (Brabys, Yellosa, Infoisinfo) to bridge any remaining gaps.
        
        CRITICAL INTEGRITY SHIELD:
        1. REAL DATA ONLY: DO NOT RETURN MOCK, PLACEHOLDER, OR SYNTHETIC DATA.
        2. NO GUESSING: NEVER construct or "guess" email addresses based on patterns.
        3. EVIDENCE MANDATE: Every field must be derived from actual snippet evidence.
        
        ID: GENERATE A UNIQUE ID STARTING WITH 'DISC_${type.toUpperCase()}_'.`;

        const response = await ai.generate({
            model: geminiModel,
            tools: [googleSearchTool],
            system: systemPrompt,
            prompt: `EXTRACT ${batchSize} VERIFIED PROFESSIONAL RECORDS FOR ${category} IN SOUTH AFRICA. FOLLOW V11 FLAT-SITE RESILIENT PROTOCOL.`,
            output: {
                schema: DiscoveryOutputSchema
            }
        });
        
        return response.output || { results: [] };

    } catch (e: any) {
        console.error("[DISCOVERY_V11] Error:", e);
        throw e;
    }
  }
);
