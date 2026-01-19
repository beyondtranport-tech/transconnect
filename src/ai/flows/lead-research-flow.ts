
'use server';
/**
 * @fileOverview An AI-powered research agent for generating potential sales leads.
 *
 * - leadResearchFlow - A function that researches potential leads based on a topic.
 * - LeadResearchInput - The input type for the function.
 * - LeadResearchOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import { LeadResearchInputSchema, LeadResearchOutputSchema, type LeadResearchInput, type LeadResearchOutput } from '@/ai/schemas';
import {z} from 'genkit';

export async function leadResearchFlow(input: LeadResearchInput): Promise<LeadResearchOutput> {
  return leadResearchAIFlow(input);
}

const leadResearchAIFlow = ai.defineFlow(
  {
    name: 'leadResearchAIFlow',
    inputSchema: LeadResearchInputSchema,
    outputSchema: LeadResearchOutputSchema,
  },
  async (input) => {
    const { text } = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt: `You are an expert market researcher specializing in the South African logistics and transport industry. Your task is to generate a list of potential business leads based on a given topic.

        Your output MUST be a valid JSON object with a single key "leads", which is an array of objects. Each object in the array should have the following fields: "companyName" (string) and "role" (string, e.g., "Vendor", "Buyer", "Partner").

        The company names should be plausible and relevant to the South African context. Do NOT invent contact details like phone numbers or emails.

        Do NOT include any text, explanation, or markdown formatting before or after the JSON object.

        Generate ${input.quantity} potential leads based on the following topic:
        - Topic: ${input.topic}
        `,
    });
    
    try {
        const parsedOutput = JSON.parse(text);
        return LeadResearchOutputSchema.parse(parsedOutput);
    } catch (e: any) {
        console.error("Failed to parse JSON from AI lead research response:", text, e);
        if (e instanceof z.ZodError) {
          throw new Error(`AI returned invalid JSON structure: ${e.message}`);
        }
        return { leads: [] };
    }
  }
);

