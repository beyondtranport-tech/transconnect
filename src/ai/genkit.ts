import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Genkit Configuration
 * Standardized to use the 'googleai/gemini-1.5-flash' identifier for maximum API resilience.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});

/**
 * Resilient model identifier for Google AI Studio v1beta.
 */
export const geminiModel = 'googleai/gemini-1.5-flash';
