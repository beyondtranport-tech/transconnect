'use server';
/**
 * @fileOverview An AI-powered research agent for generating potential sales leads.
 * 
 * - leadGenerationFlow - A function that orchestrates the research and discovery of business leads.
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
    })).describe('A list of potential leads based on the research topic.'),
    error: z.string().optional().describe('An error message if the generation failed due to configuration or API issues.')
});
export type LeadGenerationOutput = z.infer<typeof LeadGenerationOutputSchema>;


export async function leadGenerationFlow(input: LeadGenerationInput): Promise<LeadGenerationOutput> {
  try {
    return await leadGenerationAIFlow(input);
  } catch (error: any) {
    console.error("Critical error in leadGenerationFlow action:", error);
    // Return a safe object instead of throwing to prevent "Failed to fetch" on the client
    return {
      leads: [],
      error: error.message || "A technical error occurred while contacting the AI service. Please try again."
    };
  }
}

const leadGenerationAIFlow = ai.defineFlow(
  {
    name: 'leadGenerationAIFlow',
    inputSchema: LeadGenerationInputSchema,
    outputSchema: z.any(),
  },
  async (input: LeadGenerationInput): Promise<LeadGenerationOutput> => {
    try {
        const response = await ai.generate({
            model: 'googleai/gemini-1.0-pro',
            tools: [googleSearchTool],
            system: `You are an expert market research agent. 
            Your goal is to find real-world business leads based on the user's request.
            
            CRITICAL INSTRUCTIONS:
            1. You MUST use the googleSearch tool to find actual companies, websites, and contact details. 
            2. If googleSearch returns no results for a specific query, you MUST try BROADER search terms using the tool.
            3. Do not invent data. Only return information found in search results.
            4. Search for businesses in the specific geographic area mentioned.
            5. Your final output must contain at least 5 leads extracted from your searches.`,
            prompt: input.prompt,
            output: {
                schema: LeadGenerationOutputSchema
            }
        });
        
        const output = response.output;
        if (!output) {
            return { leads: [], error: "The AI model failed to produce a valid output format." };
        }
        
        return output as LeadGenerationOutput;
    } catch (error: any) {
        console.error("AI Flow Error in leadGenerationAIFlow:", error);
        throw error;
    }
  }
);
