'use server';
/**
 * @fileOverview Automated industrial discovery agent.
 * Performs deep-search and extraction of company records directly from the app.
 * Scaled to handle high-density 100-record batches.
 */

import { ai, geminiModel } from '@/ai/genkit';
import { z } from 'genkit';
import { googleSearchTool } from '../tools/google-search';

const DiscoveryInputSchema = z.object({
  category: z.string(),
  type: z.enum(['supplier', 'finance']),
  startPage: z.number().optional().default(1),
  batchSize: z.number().optional().default(100),
});
export type DiscoveryInput = z.infer<typeof DiscoveryInputSchema>;

const DiscoveryOutputSchema = z.object({
    results: z.array(z.object({
        company_name: z.string(),
        contact_person: z.string().nullable(),
        email_address: z.string().nullable(),
        telephone_number: z.string().nullable(),
        website: z.string().nullable(),
        physical_address: z.string().nullable(),
        industrial_category: z.string(),
        record_id: z.string(),
    })).describe('A list of unique discovered records.'),
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
        const { category, type, startPage, batchSize } = input;
        
        let searchContext = "";
        if (type === 'finance') {
            searchContext = `Focus on the National Credit Regulator (NCR) South Africa. Target registry pages starting at Page ${startPage}. Discover and extract exactly ${batchSize} unique ${category} providers.`;
        } else {
            searchContext = `Focus on industrial hubs in South Africa for ${category}. Discover and extract exactly ${batchSize} unique independent suppliers.`;
        }

        const systemPrompt = `You are an elite market intelligence agent.
        Your goal is to DISCOVER and EXTRACT exactly ${batchSize} unique verified business records for: "${category}".
        
        ${searchContext}

        STRICT FORENSIC RULES:
        1. HUMAN IDENTITY FIRST: You MUST find the ACTUAL NAME of the CEO, MD, or Owner.
        2. FORBIDDEN: Returning "The Director" or "Manager" is a FAILURE.
        3. CONTACTS: Prioritize verified professional emails and direct lines. No call centers (0860).
        4. SOURCE: Use LinkedIn and the official NCR register for verification.
        5. ID: Generate a unique ID starting with 'AUTO_${type.toUpperCase()}_'.`;

        const response = await ai.generate({
            model: geminiModel,
            tools: [googleSearchTool],
            system: systemPrompt,
            prompt: `Find ${batchSize} records for ${category} in South Africa. Start search from the context provided.`,
            output: {
                schema: DiscoveryOutputSchema
            }
        });
        
        return response.output || { results: [] };

    } catch (e: any) {
        console.error("[DISCOVERY_FLOW] Error:", e);
        throw e;
    }
  }
);
