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
 * Using the '-latest' suffix often resolves 404 Not Found errors on the v1beta endpoint.
 */
export const geminiModel = 'googleai/gemini-1.5-flash-latest';
