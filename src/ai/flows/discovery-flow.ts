
'use server';
/**
 * @fileOverview Automated industrial discovery agent.
 * Performs deep-search and extraction of commercial talent and company records.
 * Optimized to catalogue professional service availability while navigating privacy filters.
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
        work_identity: z.string().optional(),
        contact_person: z.string().nullable(),
        email_address: z.string().nullable(),
        telephone_number: z.string().nullable(),
        professional_contact: z.string().optional(),
        website: z.string().nullable(),
        physical_address: z.string().nullable(),
        geographic_region: z.string().optional(),
        industrial_category: z.string(),
        record_id: z.string(),
        notes: z.string().optional(),
        certification_notes: z.string().optional(),
    })).describe('A list of unique discovered professional entities.'),
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
            searchContext = `Focus on mapping PUBLICLY ADVERTISED professional workforce availability in South Africa for "${category}". Source data from professional logistics groups and commercial noticeboards where service units have published their credentials.`;
            systemPrompt = `You are an elite workforce intelligence strategist cataloguing professional service availability for the South African transport industry.
            Your goal is to MAP PUBLIC COMMERCIAL TALENT entries for: "${category}".
            
            ${searchContext}

            STRICT RESEARCH RULES:
            1. COMMERCIAL UNITS ONLY: Focus on entities that have actively published their service availability on public industry noticeboards.
            2. TALENT HANDLE: Identify the EXPLICIT HANDLE (Full Name) as listed in the professional public posting.
            3. CERTIFICATION AUDIT: Prioritize entries showing industrial signals: Code 14/EC, Code 10, valid PrDP, or NBCRFLI compliance.
            4. BUSINESS CONTEXT: Extract the commercial contact line as listed in the public advertisement.
            5. ID: Generate a unique ID starting with 'TALENT_MAP_'.`;
        } else if (type === 'finance') {
            searchContext = `Focus on the National Credit Regulator (NCR) South Africa. Target registry pages starting at Page ${startPage}. Discover and extract unique ${category} providers. Utilize LinkedIn for specific head-of-finance names.`;
            systemPrompt = `You are an elite capital intelligence agent.
            Your goal is to EXTRACT unique verified business records for: "${category}" credit providers.
            
            ${searchContext}

            STRICT FORENSIC RULES:
            1. HUMAN IDENTITY FIRST: You MUST find the ACTUAL NAME of the CEO, MD, or Owner.
            2. CONTACTS: Prioritize verified professional emails and direct lines.
            3. SOURCE: Use LinkedIn and the official industrial registers for verification.
            4. ID: Generate a unique ID starting with 'AUTO_FINANCE_'.`;
        } else {
            const prefix = type === 'transporter' ? 'TRANS' : 'SUPPLIER';
            searchContext = type === 'transporter' 
                ? `Focus on South African logistics hubs and industrial zoning registries. Discover unique professional ${category} transport companies.`
                : `Focus on industrial hubs in South Africa for ${category}. Discover unique independent suppliers.`;
            
            systemPrompt = `You are an elite market intelligence agent.
            Your goal is to DISCOVER and EXTRACT unique verified business records for: "${category}".
            
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
            prompt: `Map ${batchSize} professional talent entries for ${category} in South Africa. Focus on publicly published certifications and commercial handles.`,
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
