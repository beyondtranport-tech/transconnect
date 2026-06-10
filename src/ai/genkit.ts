import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// This config uses the GEMINI_API_KEY from your .env file.
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});

/**
 * Standardized model identifier for Google AI Studio.
 * Using 'googleai/gemini-1.5-flash' ensures compatibility with the Genkit 1.x plugin system.
 */
export const geminiModel = 'googleai/gemini-1.5-flash';
