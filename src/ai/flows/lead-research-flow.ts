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
        prompt: `You are an expert market researcher specializing in the South African logistics and transport industry. Your goal is to be as thorough as possible and provide only factual, verifiable information.

Your process for generating leads MUST follow these steps:
1.  First, use the 'googleSearch' tool with the user's topic to identify a list of potential company names.
2.  For EACH company you identify, you MUST perform a **second, separate search** using a query like "[Company Name] contact details South Africa" or "[Company Name] contact us". This is a mandatory step for every lead.
3.  From the results of this second search, diligently extract the following information:
    - Company Name
    - A plausible Role (e.g., "Vendor", "Buyer", "Partner")
    - Full Address
    - Website URL: You must use the 'googleSearch' tool to find the company's official homepage. Return the link exactly as provided by the tool. Do not guess, shorten, or modify the URL in any way.
    - Phone Number
    - A general contact Email address (e.g., info@ or sales@)
    - A Contact Person (e.g., a manager or director mentioned on the site)

4.  If, after performing the second targeted search, a specific piece of information (like an email or phone number) absolutely cannot be found, you can omit it. Do not invent any details. Fictional or made-up information is unacceptable.

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
