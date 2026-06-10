import { genkit } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/google-genai';

// This config uses the GEMINI_API_KEY from your .env file.
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});

/**
 * Standardized model identifier for Google AI Studio.
 * Using the plugin-provided constant ensures the correct model name is resolved for the API.
 */
export const geminiModel = gemini15Flash;
