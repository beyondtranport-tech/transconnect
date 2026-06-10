import {genkit} from 'genkit';
import {googleAI, gemini15Flash} from '@genkit-ai/google-genai';

// This config uses the GEMINI_API_KEY from your .env file.
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});

/**
 * Explicit model identifier used across all flows for reliability.
 * Using the exported model constant from the plugin ensures correct naming 
 * and API version resolution for the Google Generative AI service.
 */
export const geminiModel = gemini15Flash;
