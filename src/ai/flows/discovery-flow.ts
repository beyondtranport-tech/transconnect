'use server';
/**
 * @fileOverview Automated industrial discovery agent V4.
 * Performs high-fidelity extraction of commercial records with mandatory leadership mapping.
 * Optimized for South African regional accuracy and noise suppression.
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
        
        const systemPrompt = `ACT AS AN ELITE SOUTH AFRICAN INDUSTRIAL RESEARCH AGENT.
        Your goal is to DISCOVER and EXTRACT verified business records for: "${category}" in South Africa.
        
        NOISE SUPPRESSION PROTOCOL:
        1. IGNORE all search results related to "Forensic Jobs", "Data Analyst roles", or "News Articles".
        2. FOCUS ONLY on live South African companies with operational physical footprints.
        
        CRITICAL INTEGRITY SHIELD:
        1. REAL DATA ONLY: Do not return mock, placeholder, or synthetic data.
        2. DUAL-IDENTITY PROTOCOL: You MUST find the ACTUAL NAME, email, and mobile for the Marketing Manager AND the CEO/Owner.
        
        SCAVENGER MANDATE:
        - Search Facebook, LinkedIn, and local directories (Yellosa, Infoisinfo) to bridge contact gaps.
        - Scrape primary headlines to create a 300-word technical profile.
        
        ID: Generate a unique ID starting with 'DISC_${type.toUpperCase()}_'.`;

        const response = await ai.generate({
            model: geminiModel,
            tools: [googleSearchTool],
            system: systemPrompt,
            prompt: `Extract ${batchSize} verified professional records for ${category} in South Africa. RETURN RAW JSON ARRAY ONLY.`,
            output: {
                schema: DiscoveryOutputSchema
            }
        });
        
        return response.output || { results: [] };

    } catch (e: any) {
        console.error("[DISCOVERY_V4] Error:", e);
        throw e;
    }
  }
);