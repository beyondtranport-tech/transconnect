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

const leadGenerationFlowInternal = ai.defineFlow(
  {
    name: 'leadGenerationFlow',
    inputSchema: LeadGenerationInputSchema,
    outputSchema: LeadGenerationOutputSchema,
  },
  async (input) => {
    const { text } = await ai.generate({
        model: 'googleai/gemini-pro',
        prompt: `You are a lead generation expert for the transport industry. Your task is to generate plausible, fictional business leads based on a user's request.
      
        Your output MUST be a valid JSON object with a single key "leads", which is an array of objects. Each object in the array should have the following fields: "companyName" (string), "contactPerson" (string, optional), "email" (string, optional), "phone" (string, optional), "role" (string), and "status" (string, always "new").
        
        Do NOT include any text, explanation, or markdown formatting before or after the JSON object.

        User Request: Find ${input.quantity} businesses matching the type "${input.businessType}" in ${input.city || ''}, ${input.region}.
        
        For each generated lead, provide a fictional company name, and if possible, a fictional contact person, phone number, and email address.
        For each generated lead, set the 'role' field to be the value of the user's requested business type: "${input.businessType}".
        Set the status for all new leads to "new".`,
    });
    
    try {
        const parsedOutput = JSON.parse(text());
        return LeadGenerationOutputSchema.parse(parsedOutput);
    } catch (e) {
        console.error("Failed to parse JSON from AI lead generation response:", text());
        return { leads: [] };
    }
  }
);


export async function leadGenerationFlow(input: LeadGenerationInput): Promise<LeadGenerationOutput> {
    return leadGenerationFlowInternal(input);
}
