
'use server';
/**
 * @fileOverview Automated industrial discovery agent.
 * Performs deep-search and extraction of company and professional records.
 * Tuned for South African PNet, CareerJunction, Indeed, and industry noticeboards.
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
        work_identity: z.string().optional(),
        contact_person: z.string().nullable(),
        email_address: z.string().nullable(),
        telephone_number: z.string().nullable(),
        professional_contact: z.string().optional(),
        website: z.string().nullable(),
        physical_address: z.string().nullable(),
        industrial_category: z.string(),
        record_id: z.string(),
        notes: z.string().optional(),
        certification_notes: z.string().optional(),
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
            searchContext = `Focus on mapping PUBLICLY PUBLISHED professional workforce availability in South Africa for "${category}". Search specialized logistics job portals like PNet, CareerJunction, Indeed SA, and professional noticeboards like "SA Truckers" on social platforms. Target Page ${startPage} of the workforce registry.`;
            systemPrompt = `You are an elite workforce intelligence agent performing professional market mapping for the South African transport industry.
            Your goal is to MAP PUBLIC WORKFORCE AVAILABILITY records for: "${category}".
            
            ${searchContext}

            STRICT RESEARCH RULES:
            1. PUBLIC AVAILABILITY ONLY: Focus on professionals who have explicitly published their availability for placement or commercial engagement on professional noticeboards.
            2. WORK IDENTITY: You MUST identify the ACTUAL NAME of the professional from their public professional posting.
            3. CERTIFICATION SIGNALS: Prioritize records showing valid commercial licenses (Code 14/EC, Code 10), PrDP, or Hazmat endorsements.
            4. BUSINESS CONTEXT: Do not return "Private" or "Individual". Focus on the "Professional Talent Entity" as listed in the public domain.
            5. ID: Generate a unique ID starting with 'TALENT_MAP_'.`;
        } else if (type === 'finance') {
            searchContext = `Focus on the National Credit Regulator (NCR) South Africa. Target registry pages starting at Page ${startPage}. Discover and extract unique ${category} providers. Utilize LinkedIn for specific head-of-finance names.`;
            systemPrompt = `You are an elite market intelligence agent.
            Your goal is to DISCOVER and EXTRACT unique verified business records for: "${category}" credit providers.
            
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
            prompt: `Map ${batchSize} professional records for ${category} in South Africa. Focus on publicly published certifications and availability.`,
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
