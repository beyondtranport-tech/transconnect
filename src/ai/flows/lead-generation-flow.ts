'use server';
/**
 * @fileOverview An AI agent for generating business leads using Google Search.
 *
 * - leadGenerationFlow - A function that searches for potential leads based on criteria.
 * - LeadGenerationInput - The input type for the flow.
 * - LeadGenerationOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { googleSearchTool } from '@genkit-ai/google-genai';
import { LeadGenerationInputSchema, LeadGenerationOutputSchema } from '@/ai/schemas';

export const leadGenerationFlow = ai.defineFlow(
  {
    name: 'leadGenerationFlow',
    inputSchema: LeadGenerationInputSchema,
    outputSchema: LeadGenerationOutputSchema,
  },
  async (input) => {
    const location = `${input.city ? `${input.city}, ` : ''}${input.region}`;
    
    const { output } = await ai.generate({
        tools: [googleSearchTool],
        output: {
            schema: LeadGenerationOutputSchema,
        },
        prompt: `You are a lead generation expert for the transport industry. Your task is to find real-world business leads based on a user's request and structure them into the requested JSON format.

        User Request: Find ${input.quantity} ${input.role}s in ${location}.
        
        Use the Google Search tool to find these businesses. For each lead, please provide the company name, and if available, a contact person, phone number, and email address. Set the status for all new leads to "new".`,
    });
    
    return output || { leads: [] };
  }
);
