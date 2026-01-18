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

export async function matchFreight(input: MatchFreightInput): Promise<MatchFreightOutput> {
  return matchFreightFlow(input);
}

const prompt = ai.definePrompt({
  name: 'matchFreightPrompt',
  input: {schema: MatchFreightInputSchema},
  output: {schema: MatchFreightOutputSchema},
  config: {
    model: 'googleai/gemini-pro',
  },
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
