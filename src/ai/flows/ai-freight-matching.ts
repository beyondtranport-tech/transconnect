
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
import { googleAI } from '@genkit-ai/googleai';

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

    // Build a more detailed prompt based on user input.
    let prompt = `You are an AI assistant specialized in matching freight loads with transporters.

        Given the following information about a transporter:
        - Origin Location: ${input.location}
        - Destination: ${input.destination}
        - Vehicle Type: ${input.vehicleType}
        - Total Vehicle Capacity: ${input.capacity}`;
    
    if (input.rate) {
        prompt += `\n        - Desired Rate: R${input.rate} per kilometer`;
    }

    if (input.isPartLoad && input.palletCount) {
        prompt += `\n        - Load Type: This is a PART LOAD. The transporter has space for approximately ${input.palletCount} pallets (roughly ${input.palletCount} tons).`;
    } else {
        prompt += `\n        - Load Type: Looking for a FULL LOAD.`;
    }
    
    if (input.preferences) {
        prompt += `\n        - Other Preferences: ${input.preferences}`;
    }

    prompt += `\n\nFind available freight loads that match these criteria. Critically, if it is a part load, only return loads that would fit the specified pallet count.`;

    const { output } = await ai.generate({
        model: googleAI.model('gemini-2.5-flash'),
        prompt: prompt,
        output: {
            schema: MatchFreightOutputSchema
        }
    });
    
    return output || { matches: [] };
  }
);
