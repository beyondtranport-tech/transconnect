'use server';
/**
 * @fileOverview An AI agent for generating business leads.
 *
 * - leadGenerationFlow - A function that creates potential leads based on criteria.
 * - LeadGenerationInput - The input type for the flow.
 * - LeadGenerationOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
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
        output: {
            schema: LeadGenerationOutputSchema,
        },
        prompt: `You are a lead generation expert for the transport industry. Your task is to generate plausible, fictional business leads based on a user's request and structure them into the requested JSON format. Do NOT search the web. Create realistic-sounding but fake company names and contact details.

        User Request: Find ${input.quantity} businesses matching the type "${input.businessType}" in ${input.city || ''}, ${input.region}.
        
        For each generated lead, provide a fictional company name, and if possible, a fictional contact person, phone number, and email address.
        For each generated lead, set the 'role' field to be the value of the user's requested business type: "${input.businessType}".
        Set the status for all new leads to "new".`,
    });
    return output || { leads: [] };
  }
);
