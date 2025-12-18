'use server';
/**
 * @fileOverview An AI-powered freight matching tool for transporters.
 *
 * - matchFreight - A function that matches freight loads with available transporters.
 * - MatchFreightInput - The input type for the matchFreight function.
 * - MatchFreightOutput - The return type for the matchFreight function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MatchFreightInputSchema = z.object({
  location: z.string().describe('The current location of the transporter.'),
  vehicleType: z.string().describe('The type of vehicle the transporter has (e.g., truck, van).'),
  capacity: z.string().describe('The carrying capacity of the vehicle.'),
  preferences: z.string().optional().describe('Any specific preferences or requirements of the transporter.'),
});
export type MatchFreightInput = z.infer<typeof MatchFreightInputSchema>;

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
export type MatchFreightOutput = z.infer<typeof MatchFreightOutputSchema>;

export async function matchFreight(input: MatchFreightInput): Promise<MatchFreightOutput> {
  return matchFreightFlow(input);
}

const prompt = ai.definePrompt({
  name: 'matchFreightPrompt',
  input: {schema: MatchFreightInputSchema},
  output: {schema: MatchFreightOutputSchema},
  prompt: `You are an AI assistant specialized in matching freight loads with transporters.

  Given the following information about a transporter:
  - Location: {{{location}}}
  - Vehicle Type: {{{vehicleType}}}
  - Capacity: {{{capacity}}}
  - Preferences: {{{preferences}}}

  Find available freight loads that match these criteria.  Provide a list of freight loads that include:
  - loadId: The ID of the freight load.
  - origin: The origin location of the freight load.
  - destination: The destination location of the freight load.
  - weight: The weight of the freight load.
  - size: The size of the freight load.
  - price: The price offered for the freight load.
  - requirements: Any special requirements for the freight load.

  Return the matches in JSON format.
  `,
});

const matchFreightFlow = ai.defineFlow(
  {
    name: 'matchFreightFlow',
    inputSchema: MatchFreightInputSchema,
    outputSchema: MatchFreightOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
