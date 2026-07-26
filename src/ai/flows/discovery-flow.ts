'use server';
/**
 * @fileOverview Automated industrial discovery agent V12.
 * INDUCTIVE RECONSTRUCTION PROTOCOL: Stitches fragments from multiple sources.
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
        
        const systemPrompt = `ACT AS AN ELITE SOUTH AFRICAN INDUSTRIAL RESEARCH AGENT (V12 - INDUCTIVE RECONSTRUCTION).
        RETURN ONLY RAW JSON. NO MARKDOWN. NO CODE BLOCKS. NO PREAMBLE.
        
        REQUIRED INVESTIGATION PROTOCOL PER RECORD:
        1. ACRONYM EXPANSION: Identify full legal names from initials.
        2. INDUCTIVE STITCHING: Combine data fragments from multiple sources. Stitch directory landlines with social bio emails and human names.
        3. FLAT-SITE ANALYSIS: Many haulier sites are one-page. Analyze root domain snippets for "Contact Cards" and "Sections".
        4. IDENTITY RESOLUTION: Identify the CEO and Marketing Manager by name. Pivot to LinkedIn/Facebook snippets to resolve their direct contact details.
        
        CRITICAL INTEGRITY SHIELD:
        1. REAL DATA ONLY: DO NOT RETURN MOCK, PLACEHOLDER, OR SYNTHETIC DATA.
        2. EVIDENCE MANDATE: Every field must be derived from actual snippet evidence.
        
        ID: GENERATE A UNIQUE ID STARTING WITH 'DISC_${type.toUpperCase()}_'.`;

        const response = await ai.generate({
            model: geminiModel,
            tools: [googleSearchTool],
            system: systemPrompt,
            prompt: `EXTRACT ${batchSize} UNIQUE VERIFIED PROFESSIONAL RECORDS FOR ${category} IN SOUTH AFRICA. FOLLOW V12 INDUCTIVE PROTOCOL.`,
            output: {
                schema: DiscoveryOutputSchema
            }
        });
        
        return response.output || { results: [] };

    } catch (e: any) {
        console.error("[DISCOVERY_V12] Error:", e);
        throw e;
    }
  }
);
