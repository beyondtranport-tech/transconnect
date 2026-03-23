'use server';
/**
 * @fileOverview An AI-powered research agent for generating potential sales leads.
 *
 * - leadGenerationFlow - A function that researches potential leads based on a topic.
 * - LeadGenerationInputSchema - The input schema for the function.
 * - LeadGenerationOutputSchema - The output schema for the function.
 */

import { ai } from '@/ai/genkit';
import { googleSearchTool } from '../tools/google-search';
import { z } from 'zod';

// Define schemas directly in this file to be self-contained.
export const LeadGenerationInputSchema = z.object({
  prompt: z.string().min(20, 'Please provide a detailed prompt.').describe('A detailed prompt for the AI agent, instructing it what to research.'),
});
export type LeadGenerationInput = z.infer<typeof LeadGenerationInputSchema>;

export const LeadGenerationOutputSchema = z.object({
    leads: z.array(z.object({
        companyName: z.string().describe('The name of the potential lead company.'),
        role: z.string().describe('The likely role of this company in the ecosystem (e.g., Vendor, Buyer, Partner).'),
        address: z.string().nullable().optional().describe("The company's physical address, if found."),
        website: z.string().url().nullable().optional().describe("The company's website URL, if found."),
        phone: z.string().nullable().optional().describe("The company's primary phone number, if found."),
        email: z.string().email().nullable().optional().describe("A general contact email for the company (e.g., info@, sales@), if found."),
        contactPerson: z.string().nullable().optional().describe("A potential contact person's name, if found."),
    })).describe('A list of potential leads based on the research topic.')
});
export type LeadGenerationOutput = z.infer<typeof LeadGenerationOutputSchema>;


export async function leadGenerationFlow(input: LeadGenerationInput): Promise<LeadGenerationOutput> {
  return leadGenerationAIFlow(input);
}

const leadGenerationAIFlow = ai.defineFlow(
  {
    name: 'leadGenerationAIFlow',
    inputSchema: LeadGenerationInputSchema,
    outputSchema: LeadGenerationOutputSchema,
  },
  async (input: LeadGenerationInput): Promise<LeadGenerationOutput> => {
    const response = await ai.generate({
        model: 'gemini-1.5-flash',
        tools: [googleSearchTool],
        prompt: input.prompt,
        output: {
            schema: LeadGenerationOutputSchema
        }
    });
    
    const output = response.output;
    if (!output || !output.leads) {
        return { leads: [] };
    }
    
    // Post-process the output to clean up "null" strings and invalid formats.
    const cleanedLeads = output.leads.map((lead: { companyName: string, role: string, address?: string | null, website?: string | null, phone?: string | null, email?: string | null, contactPerson?: string | null }) => {
        const cleanedLead = { ...lead };
        
        // Convert string "null" or "N/A" to actual null
        (Object.keys(cleanedLead) as Array<keyof typeof cleanedLead>).forEach(key => {
            const value = cleanedLead[key];
            if (typeof value === 'string' && (value.toLowerCase() === 'null' || value.toLowerCase() === 'n/a')) {
                (cleanedLead as any)[key] = null;
            }
        });

        // Specifically validate and nullify email if invalid
        if (cleanedLead.email && !z.string().email().safeParse(cleanedLead.email).success) {
            cleanedLead.email = null;
        }

        // Specifically validate and nullify website if invalid
        if (cleanedLead.website && !z.string().url().safeParse(cleanedLead.website).success) {
            cleanedLead.website = null;
        }

        return cleanedLead;
    });

    return { leads: cleanedLeads };
  }
);
