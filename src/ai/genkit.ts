import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// This config uses the GEMINI_API_KEY from your .env file.
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});

// Using the stable string identifier for the Gemini 1.5 Flash model.
// This is the most reliable way to route requests in Genkit v1.x.
export const geminiModel = 'googleai/gemini-1.5-flash';
