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
import { LeadGenerationInputSchema, LeadGenerationOutputSchema, type LeadGenerationInput, type LeadGenerationOutput } from '@/ai/schemas';


export const leadGenerationFlow = ai.defineFlow(
  {
    name: 'leadGenerationFlow',
    inputSchema: LeadGenerationInputSchema,
    outputSchema: LeadGenerationOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
        model: 'googleai/gemini-1.5-flash-preview',
        tools: [googleSearchTool],
        output: {
            schema: LeadGenerationOutputSchema,
        },
        prompt: `You are a lead generation expert for the transport industry. Your task is to find real-world business leads based on a user's request and structure them into the requested JSON format.

        User Request: Find ${input.quantity} businesses matching the type "${input.businessType}" in ${input.city || ''}, ${input.region}.
        
        Use the Google Search tool to find these businesses. For each lead, provide the company name, and if available, a contact person, phone number, and email address.
        For each generated lead, set the 'role' field to be the value of the user's requested business type: "${input.businessType}".
        Set the status for all new leads to "new".`,
    });
    return output || { leads: [] };
  }
);
