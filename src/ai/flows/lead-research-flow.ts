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
        model: 'googleai/gemini-1.5-flash-latest',
        tools: [googleSearchTool],
        prompt: `You are an expert market researcher specializing in the South African logistics and transport industry. 
        Your task is to generate a list of real business leads based on a given topic.

        You MUST use the 'googleSearch' tool to find real companies. Do NOT invent company names, websites, or addresses.
        
        Use the search results to extract the company name, a plausible role (e.g., "Vendor", "Buyer", "Partner"), and if available, their address and website from the search snippets or titles.

        Generate ${input.quantity} potential leads based on the following topic:
        - Topic: ${input.topic}
        `,
        output: {
            schema: LeadResearchOutputSchema
        }
    });
    
    return output || { leads: [] };
  }
);
