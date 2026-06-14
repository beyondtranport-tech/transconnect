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
        service_handle: z.string().optional(),
        contact_person: z.string().nullable(),
        email_address: z.string().nullable(),
        telephone_number: z.string().nullable(),
        registry_line: z.string().optional(),
        professional_contact: z.string().optional(),
        website: z.string().nullable(),
        physical_address: z.string().nullable(),
        geographic_region: z.string().optional(),
        operational_hub: z.string().optional(),
        industrial_category: z.string(),
        record_id: z.string(),
        notes: z.string().optional(),
        capability_profile: z.string().optional(),
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
            searchContext = `Focus on mapping PUBLICLY ADVERTISED commercial service availability in South Africa for "${category}". Source data from industrial logistics noticeboards.`;
            systemPrompt = `ACT AS AN ELITE INDUSTRIAL RECRUITMENT STRATEGIST.
            Your goal is to MAP PUBLIC COMMERCIAL SERVICE NODES for: "${category}".
            
            STRICT RESEARCH RULES:
            1. REAL DATA ONLY: Do not use synthetic or generic descriptions.
            2. SERVICE HANDLE: Identify the EXPLICIT IDENTITY as listed in the professional public notice.
            3. FORBIDDEN WORDS: innovative, leading, spearheading, ecosystem, backbone.
            4. ID: Generate a unique ID starting with 'LOG_NODE_'.`;
        } else if (type === 'finance') {
            searchContext = `Focus on the National Credit Regulator (NCR) South Africa and official LinkedIn leadership pages.`;
            systemPrompt = `ACT AS AN ELITE CAPITAL INTELLIGENCE AGENT.
            Your goal is to EXTRACT unique verified business records for: "${category}" credit providers.
            
            STRICT FORENSIC RULES:
            1. HUMAN IDENTITY FIRST: You MUST find the ACTUAL NAME of the CEO, MD, or Head of Credit.
            2. OFFICIAL WEBSITE ONLY: Do not return aggregate registry sites.
            3. FORBIDDEN WORDS: innovative, leading, spearheading, solutions.
            4. ID: Generate a unique ID starting with 'AUTO_FINANCE_'.`;
        } else {
            const prefix = type === 'transporter' ? 'TRANS' : 'SUPPLIER';
            searchContext = type === 'transporter' 
                ? `Focus on South African logistics hubs and industrial zoning registries. Discover unique professional ${category} transport companies.`
                : `Focus on industrial hubs in South Africa for ${category}. Discover unique independent suppliers.`;
            
            systemPrompt = `ACT AS AN ELITE MARKET INTELLIGENCE AGENT SPECIALIZING IN THE SOUTH AFRICAN TRANSPORT ECOSYSTEM.
            Your goal is to DISCOVER and EXTRACT verified business records for: "${category}".
            
            STRICT FORENSIC RULES:
            1. TECHNICAL SERVICE SUMMARY: In the notes field, provide a 2-sentence summary of SPECIFIC fleet or parts capabilities.
            2. FORBIDDEN WORDS: innovative, leading, spearheading, ecosystem, backbone. DO NOT use corporate fluff.
            3. OFFICIAL WEBSITE ONLY: If you cannot find a corporate domain (www.company.co.za), return null.
            4. ID: Generate a unique ID starting with 'AUTO_${prefix}_'.`;
        }

        const response = await ai.generate({
            model: geminiModel,
            tools: [googleSearchTool],
            system: systemPrompt,
            prompt: `Extract ${batchSize} verified professional records for ${category} in South Africa. Focus on publicly published certifications and commercial handles. Return RAW JSON ONLY.`,
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