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
import {z} from 'genkit';

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
    const { text } = await ai.generate({
        model: 'googleai/gemini-1.5-flash-latest',
        prompt: `You are an AI assistant specialized in matching freight loads with transporters.

        Your output MUST be a valid JSON object with a single key "matches", which is an array of objects. Each object in the array should have the following fields: "loadId" (string), "origin" (string), "destination" (string), "weight" (string), "size" (string), "price" (string), and "requirements" (string, optional).

        Do NOT include any text, explanation, or markdown formatting before or after the JSON object.

        Given the following information about a transporter:
        - Location: ${input.location}
        - Vehicle Type: ${input.vehicleType}
        - Capacity: ${input.capacity}
        - Preferences: ${input.preferences || 'None'}

        Find available freight loads that match these criteria and return them in the specified JSON format.`,
    });
    
    try {
        const parsedOutput = JSON.parse(text());
        return MatchFreightOutputSchema.parse(parsedOutput);
    } catch (e: any) {
        console.error("Failed to parse JSON from AI freight matching response:", text(), e);
        if (e instanceof z.ZodError) {
          throw new Error(`AI returned invalid JSON structure: ${e.message}`);
        }
        return { matches: [] };
    }
  }
);
