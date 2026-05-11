'use server';
/**
 * @fileOverview An AI-powered research agent for generating potential sales leads.
 *
 * - leadGenerationFlow - A function that researches potential leads based on a topic.
 * - LeadGenerationInput - The input type for the function.
 * - LeadGenerationOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { googleSearchTool } from '../tools/google-search';
import { z } from 'genkit'; 

const LeadGenerationInputSchema = z.object({
  prompt: z.string().min(20, 'Please provide a detailed prompt.').describe('A detailed prompt for the AI agent, instructing it what to research.'),
});
export type LeadGenerationInput = z.infer<typeof LeadGenerationInputSchema>;

const LeadGenerationOutputSchema = z.object({
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
    try {
        const response = await ai.generate({
            model: 'googleai/gemini-1.5-flash',
            tools: [googleSearchTool],
            system: `You are an expert market research agent. 
            Your goal is to find real-world business leads based on the user's request.
            
            CRITICAL INSTRUCTIONS:
            1. You MUST use the googleSearch tool to find actual companies, websites, and contact details. 
            2. Do not invent data. Only return information found in search results.
            3. Search for businesses in the specific geographic area mentioned (usually South Africa).
            4. If no results are found for a specific query, try a broader search using the tool.
            5. Return a list of at least 5 leads if possible.`,
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
        const cleanedLeads = output.leads.map((lead: any) => {
            const cleanedLead = { ...lead };
            
            (Object.keys(cleanedLead) as Array<keyof typeof cleanedLead>).forEach(key => {
                const value = cleanedLead[key];
                if (typeof value === 'string' && (value.toLowerCase() === 'null' || value.toLowerCase() === 'n/a')) {
                    (cleanedLead as any)[key] = null;
                }
            });

            if (cleanedLead.email && !z.string().email().safeParse(cleanedLead.email).success) {
                cleanedLead.email = null;
            }

            if (cleanedLead.website && !z.string().url().safeParse(cleanedLead.website).success) {
                cleanedLead.website = null;
            }

            return cleanedLead;
        });

        return { leads: cleanedLeads };
    } catch (error: any) {
        console.error("AI Flow Error in leadGenerationAIFlow:", error);
        // Ensure we always return a valid object to prevent production render crashes
        return { leads: [] };
    }
  }
);
