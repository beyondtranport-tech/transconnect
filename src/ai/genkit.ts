import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// This config uses the GEMINI_API_KEY from your .env file.
export const ai = genkit({
  plugins: [
    googleAI({ 
        apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
});

// Standard identifier for Genkit v1.x with the Google AI plugin.
// Using the short name allows the plugin to handle the routing and versioning (v1 or v1beta) correctly.
export const geminiModel = 'gemini-1.5-flash';
