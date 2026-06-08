'use server';
/**
 * @fileOverview Automated industrial discovery agent.
 * Performs deep-search and extraction of company and professional records.
 * Scaled to handle high-density 100-record batches.
 */

import { ai, geminiModel } from '@/ai/genkit';
import { z } from 'genkit';
import { googleSearchTool } from '../tools/google-search';

const DiscoveryInputSchema = z.object({
  category: z.string(),
  type: z.enum(['supplier', 'finance', 'transporter', 'driver']),
  startPage: z.number().optional().default(1),
  batchSize: z.number().optional().default(100),
});
export type DiscoveryInput = z.infer<typeof DiscoveryInputSchema>;

const DiscoveryOutputSchema = z.object({
    results: z.array(z.object({
        company_name: z.string().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        contact_person: z.string().nullable(),
        email_address: z.string().nullable(),
        telephone_number: z.string().nullable(),
        website: z.string().nullable(),
        physical_address: z.string().nullable(),
        industrial_category: z.string(),
        record_id: z.string(),
        notes: z.string().optional(),
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
        let systemPrompt = "";

        if (type === 'driver') {
            searchContext = `Focus on public professional profiles on LinkedIn and established South African Trucking Groups on Facebook. Discover and map exactly ${batchSize} unique professional drivers specializing in: ${category}.`;
            systemPrompt = `You are an elite recruitment intelligence agent.
            Your goal is to PERFORM PROFESSIONAL MARKET MAPPING of public professional profiles for: "${category} Drivers".
            
            ${searchContext}

            STRICT RESEARCH RULES:
            1. PUBLIC DATA ONLY: Focus on identifying individuals who have published their professional availability on public networking platforms.
            2. FORENSIC IDENTITY: You MUST identify the ACTUAL FULL NAME of the professional.
            3. CERTIFICATIONS: Prioritize profiles showing valid commercial licenses (Code 14, Hazmat, etc.).
            4. FORBIDDEN: Returning "The Driver" or "Anonymous" is a FAILURE.
            5. ID: Generate a unique ID starting with 'AUTO_DRIVER_'.`;
        } else if (type === 'finance') {
            searchContext = `Focus on the National Credit Regulator (NCR) South Africa. Target registry pages starting at Page ${startPage}. Discover and extract exactly ${batchSize} unique ${category} providers.`;
            systemPrompt = `You are an elite market intelligence agent.
            Your goal is to DISCOVER and EXTRACT exactly ${batchSize} unique verified business records for: "${category}".
            
            ${searchContext}

            STRICT FORENSIC RULES:
            1. HUMAN IDENTITY FIRST: You MUST find the ACTUAL NAME of the CEO, MD, or Owner.
            2. CONTACTS: Prioritize verified professional emails and direct lines.
            3. SOURCE: Use LinkedIn and the official industrial registers for verification.
            4. ID: Generate a unique ID starting with 'AUTO_FINANCE_'.`;
        } else {
            const prefix = type === 'transporter' ? 'TRANS' : 'SUPPLIER';
            searchContext = type === 'transporter' 
                ? `Focus on South African logistics hubs. Discover and extract exactly ${batchSize} unique professional ${category} transport companies.`
                : `Focus on industrial hubs in South Africa for ${category}. Discover and extract exactly ${batchSize} unique independent suppliers.`;
            
            systemPrompt = `You are an elite market intelligence agent.
            Your goal is to DISCOVER and EXTRACT exactly ${batchSize} unique verified business records for: "${category}".
            
            ${searchContext}

            STRICT FORENSIC RULES:
            1. HUMAN IDENTITY FIRST: Find the ACTUAL NAME of the MD or Owner.
            2. CONTACTS: Prioritize verified professional emails and direct lines.
            3. ID: Generate a unique ID starting with 'AUTO_${prefix}_'.`;
        }

        const response = await ai.generate({
            model: geminiModel,
            tools: [googleSearchTool],
            system: systemPrompt,
            prompt: `Identify ${batchSize} public professional records for ${category} in South Africa. Start search from the context provided.`,
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
