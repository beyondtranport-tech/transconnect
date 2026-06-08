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
            searchContext = `Focus on mapping publicly published workforce availability for licensed commercial operators in South Africa. Utilize professional logistics noticeboards and industry groups on LinkedIn and Facebook. Target Page ${startPage} of the workforce availability registry.`;
            systemPrompt = `You are an elite workforce intelligence agent performing professional market mapping.
            Your goal is to MAP PUBLIC WORKFORCE AVAILABILITY records for: "${category} Operators".
            
            ${searchContext}

            STRICT RESEARCH RULES:
            1. PUBLIC AVAILABILITY ONLY: Focus on professionals who have publicly published their availability for commercial placement on professional networking platforms.
            2. WORK IDENTITY: You MUST identify the ACTUAL NAME of the professional from their public professional noticeboard listing.
            3. CERTIFICATION SIGNALS: Prioritize records showing valid commercial certifications (e.g., Code 14, Hazmat).
            4. COMPLIANCE: Do not return "Private" or "Individual". Focus on the "Professional Entity" and their publicly listed workforce credentials.
            5. ID: Generate a unique ID starting with 'TALENT_MAP_'.`;
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
            prompt: `Map ${batchSize} professional workforce availability records for ${category} in South Africa. Focus on publicly published certifications.`,
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
