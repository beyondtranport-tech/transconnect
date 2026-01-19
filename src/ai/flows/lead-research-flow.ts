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
import { googleSearchTool } from '../tools/google-search';

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
    const { output } = await ai.generate({
        model: 'googleai/gemini-2.0-flash',
        tools: [googleSearchTool],
        prompt: input.prompt,
        output: {
            schema: LeadResearchOutputSchema
        }
    });
    
    return output || { leads: [] };
  }
);
