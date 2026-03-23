
'use server';
/**
 * @fileOverview An AI-powered freight matching tool for transporters.
 *
 * - matchFreight - A function that matches freight loads with available transporters.
 * - MatchFreightInput - The input type for the matchFreight function.
 * - MatchFreightOutput - The return type for the matchFreight function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit'; // Use the zod instance re-exported by Genkit
import { MatchFreightInputSchema as ClientInputSchema, MatchFreightOutputSchema as ClientOutputSchema, type MatchFreightInput, type MatchFreightOutput } from '@/ai/schemas';

// Re-define the schemas using the 'z' from 'genkit' to ensure type compatibility for the flow.
// This avoids duplicating the entire schema definition by just referencing the shape.
const MatchFreightInputSchema = z.object(ClientInputSchema.shape);
const MatchFreightOutputSchema = z.object(ClientOutputSchema.shape);


export async function matchFreight(input: MatchFreightInput): Promise<MatchFreightOutput> {
  return matchFreightFlow(input);
}

const matchFreightFlow = ai.defineFlow(
  {
    name: 'matchFreightFlow',
    inputSchema: MatchFreightInputSchema,
    outputSchema: MatchFreightOutputSchema,
  },
  async (input: MatchFreightInput) => {

    // Build a more detailed prompt based on user input.
    let prompt = `You are an AI assistant specialized in matching freight loads with transporters.

        Given the following information about a transporter:
        - Origin Location: ${input.location}
        - Destination: ${input.destination}
        - Vehicle Type: ${input.vehicleType}
        - Total Vehicle Capacity: ${input.capacity}`;
    
    if (input.rate) {
        prompt += `
        - Desired Rate: R${input.rate} per kilometer`;
    }

    if (input.isPartLoad && input.palletCount) {
        prompt += `
        - Load Type: This is a PART LOAD. The transporter has space for approximately ${input.palletCount} pallets (roughly ${input.palletCount} tons).`;
    } else {
        prompt += `
        - Load Type: Looking for a FULL LOAD.`;
    }
    
    if (input.preferences) {
        prompt += `
        - Other Preferences: ${input.preferences}`;
    }

    prompt += `

Find available freight loads that match these criteria. Critically, if it is a part load, only return loads that would fit the specified pallet count.`;

    const response = await ai.generate({
        model: 'gemini-1.5-flash',
        prompt: prompt,
        output: {
            schema: MatchFreightOutputSchema
        }
    });
    
    return response.output || { matches: [] };
  }
);
