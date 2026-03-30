
'use server';
/**
 * @fileOverview An AI-powered freight matching tool for transporters.
 *
 * - matchFreight - A function that matches freight loads with available transporters.
 * - MatchFreightInput - The input type for the matchFreight function.
 * - MatchFreightOutput - The return type for the matchFreight function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const MatchFreightInputSchema = z.object({
  location: z.string().describe('The current location of the transporter.'),
  destination: z.string().describe('The desired destination for the transporter.'),
  vehicleType: z.string().describe('The type of vehicle the transporter has (e.g., truck, van).'),
  capacity: z.string().describe('The carrying capacity of the vehicle.'),
  preferences: z.string().optional().describe('Any specific preferences or requirements of the transporter.'),
  rate: z.number().positive().optional(),
  isPartLoad: z.boolean().optional(),
  palletCount: z.number().int().positive().optional(),
});

const MatchFreightOutputSchema = z.object({
  matches: z.array(
    z.object({
      loadId: z.string().describe('The ID of the freight load.'),
      origin: z.string().describe('The origin location of the freight load.'),
      destination: z.string().describe('The destination location of the freight load.'),
      weight: z.string().describe('The weight of the freight load.'),
      size: z.string().describe('The size of the freight load.'),
      price: z.string().describe('The price offered for the freight load.'),
      requirements: z.string().optional().describe('Any special requirements for the freight load.'),
    })
  ).describe('A list of freight loads that match the transporter criteria.'),
});


export type MatchFreightInput = z.infer<typeof MatchFreightInputSchema>;
export type MatchFreightOutput = z.infer<typeof MatchFreightOutputSchema>;


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

Find available freight loads that match these criteria. Critically, if it is a part load, only return loads that would fit the specified palletCount.`;

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
