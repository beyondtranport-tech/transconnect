
'use server';
/**
 * @fileOverview An AI-powered Text-to-Speech (TTS) flow.
 *
 * - generateAudio - A function that converts text to speech.
 * - TTSInput - The input type for the generateAudio function.
 * - TTSOutput - The return type for the generateAudio function.
 */

import { ai } from '@/ai/genkit';
import { TTSInputSchema, TTSOutputSchema, type TTSInput, type TTSOutput } from '@/ai/schemas';

// TTS functionality is temporarily disabled due to package incompatibilities.
// This will be re-enabled after an upgrade to Next.js 15.

export async function generateAudio(input: TTSInput): Promise<TTSOutput> {
  return ttsFlow(input);
}

const ttsFlow = ai.defineFlow(
  {
    name: 'ttsFlow',
    inputSchema: TTSInputSchema,
    outputSchema: TTSOutputSchema,
  },
  async (input: TTSInput) => {
    // Return a dummy value instead of throwing an error to prevent server crashes.
    console.warn("ttsFlow is disabled and returning an empty response.");
    return { audioDataUri: "" };
  }
);
