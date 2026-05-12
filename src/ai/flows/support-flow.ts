'use server';
/**
 * @fileOverview An AI-powered customer support agent.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SupportInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.array(z.object({ text: z.string() })),
  })).optional().describe('The conversation history prior to the latest query.'),
  query: z.string().min(1, "Query cannot be empty.").describe('The latest user question.'),
});
export type SupportInput = z.infer<typeof SupportInputSchema>;

const SupportOutputSchema = z.object({
  response: z.string().describe("The AI assistant's helpful response."),
});
export type SupportOutput = z.infer<typeof SupportOutputSchema>;


export async function supportQuery(input: SupportInput): Promise<SupportOutput> {
  return supportFlow(input);
}

const supportFlow = ai.defineFlow(
  {
    name: 'supportFlow',
    inputSchema: SupportInputSchema,
    outputSchema: SupportOutputSchema,
  },
  async (input: SupportInput) => {
    const { history, query } = input;
    
    try {
        const formattedHistory = history || [];

        const response = await ai.generate({
            model: 'googleai/gemini-1.5-flash',
            system: `You are a helpful and friendly AI assistant for Logistics Flow.
            Keep your answers concise, helpful, and encouraging.`,
            messages: [
                ...formattedHistory,
                { role: 'user', content: [{ text: query }] }
            ],
        });
        
        const textResponse = response.text;
        
        if (!textResponse) {
            throw new Error("The AI model returned an empty response.");
        }
        
        return { response: textResponse };
    } catch (e: any) {
        console.error("Error inside supportFlow:", e);
        throw new Error(`The AI service is currently unavailable. Details: ${e.message}`);
    }
  }
);
