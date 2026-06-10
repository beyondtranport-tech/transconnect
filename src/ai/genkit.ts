import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Genkit Configuration
 * Uses the GEMINI_API_KEY from your .env file.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});

/**
 * Standardized model identifier for Google AI Studio.
 * Using a direct string identifier ensures maximum resilience across server actions.
 */
export const geminiModel = 'googleai/gemini-1.5-flash';
