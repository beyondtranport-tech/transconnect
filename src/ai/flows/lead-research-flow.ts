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
import { z } from 'zod';
import { googleAI } from '@genkit-ai/google-genai';

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
        model: googleAI.model('gemini-2.5-flash'),
        tools: [googleSearchTool],
        prompt: input.prompt,
        output: {
            schema: LeadResearchOutputSchema
        }
    });
    
    if (!output || !output.leads) {
        return { leads: [] };
    }
    
    // Post-process the output to clean up "null" strings and invalid formats.
    const cleanedLeads = output.leads.map(lead => {
        const cleanedLead = { ...lead };
        
        // Convert string "null" or "N/A" to actual null
        (Object.keys(cleanedLead) as Array<keyof typeof cleanedLead>).forEach(key => {
            const value = cleanedLead[key];
            if (typeof value === 'string' && (value.toLowerCase() === 'null' || value.toLowerCase() === 'n/a')) {
                (cleanedLead as any)[key] = null;
            }
        });

        // Specifically validate and nullify email if invalid
        if (cleanedLead.email && !z.string().email().safeParse(cleanedLead.email).success) {
            cleanedLead.email = null;
        }

        // Specifically validate and nullify website if invalid
        if (cleanedLead.website && !z.string().url().safeParse(cleanedLead.website).success) {
            cleanedLead.website = null;
        }

        return cleanedLead;
    });

    return { leads: cleanedLeads };
  }
);
