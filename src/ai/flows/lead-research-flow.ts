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
        prompt: `You are an expert market researcher specializing in the South African logistics and transport industry. 
        Your task is to generate a list of real business leads based on a given topic. Your goal is to be as thorough as possible and provide only factual, verifiable information.

        You MUST use the 'googleSearch' tool to find real companies. Do NOT invent any details. Fictional or made-up information is not acceptable.
        
        For each company, use the search results to find the following information:
        - Company Name
        - A plausible Role (e.g., "Vendor", "Buyer", "Partner")
        - Full Address (if available)
        - Website URL: Crucially, only provide a website URL if it is explicitly returned by the 'googleSearch' tool. Do not guess or construct URLs. If no URL is found, omit the field entirely.
        - Phone Number (if available)
        - A general contact Email address (like info@ or sales@, if available)
        - A Contact Person (if a name is mentioned on their site, otherwise leave it out)

        If a specific piece of information cannot be found, do not include the field in the result for that lead. Be persistent; if the first search doesn't yield contact details, try searching for the company's "contact us" page.

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
