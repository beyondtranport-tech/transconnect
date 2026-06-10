import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// This config uses the GEMINI_API_KEY from your .env file.
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});

/**
 * Standardized model identifier for Google AI Studio.
 * Using 'gemini-1.5-flash' directly to ensure compatibility with the v1beta endpoint.
 */
export const geminiModel = 'gemini-1.5-flash';
