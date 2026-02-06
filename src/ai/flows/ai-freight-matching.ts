'use server';
/**
 * @fileOverview An AI-powered freight matching tool for transporters.
 *
 * - matchFreight - A function that matches freight loads with available transporters.
 * - MatchFreightInput - The input type for the matchFreight function.
 * - MatchFreightOutput - The return type for the matchFreight function.
 */

import {ai} from '@/ai/genkit';
import { MatchFreightInputSchema, MatchFreightOutputSchema, type MatchFreightInput, type MatchFreightOutput } from '@/ai/schemas';
import { googleAI } from '@genkit-ai/google-genai';

export async function matchFreight(input: MatchFreightInput): Promise<MatchFreightOutput> {
  return matchFreightFlow(input);
}

const matchFreightFlow = ai.defineFlow(
  {
    name: 'matchFreightFlow',
    inputSchema: MatchFreightInputSchema,
    outputSchema: MatchFreightOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
        model: googleAI.model('gemini-2.5-flash'),
        prompt: `You are an AI assistant specialized in matching freight loads with transporters.

        Given the following information about a transporter:
        - Location: ${input.location}
        - Vehicle Type: ${input.vehicleType}
        - Capacity: ${input.capacity}
        - Preferences: ${input.preferences || 'None'}

        Find available freight loads that match these criteria.`,
        output: {
            schema: MatchFreightOutputSchema
        }
    });
    
    return output || { matches: [] };
  }
);
