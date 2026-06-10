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
 * Using the short string identifier ensures compatibility with Google AI Studio API.
 */
export const geminiModel = 'gemini-1.5-flash';
