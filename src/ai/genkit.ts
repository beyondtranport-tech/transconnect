import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// This config uses the GEMINI_API_KEY from your .env file.
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});

/**
 * Explicit model identifier used across all flows for reliability.
 * Updated to use the 'googleai/' prefix required by the Genkit Google AI plugin.
 */
export const geminiModel = 'googleai/gemini-1.5-flash';
