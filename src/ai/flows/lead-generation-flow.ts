'use server';
/**
 * @fileOverview An AI agent for generating business leads.
 *
 * - leadGenerationFlow - A function that searches for potential leads based on criteria.
 * - LeadGenerationInput - The input type for the flow.
 * - LeadGenerationOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
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
        model: 'googleai/gemini-pro',
        output: {
            schema: LeadGenerationOutputSchema,
        },
        prompt: `You are a lead generation expert for the transport industry. Your task is to generate fictional, but realistic-looking, potential leads based on a user's request and structure them into the requested JSON format. Do not use any external tools or real-world data.

        User Request: Find ${input.quantity} ${input.role}s in ${location}.
        
        For each lead, please generate a plausible company name, a contact person, a phone number, and an email address. Set the status to "new".`,
    });
    
    return output || { leads: [] };
  }
);
