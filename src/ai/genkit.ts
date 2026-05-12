
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

// Export a stable string identifier for standardized usage across all flows.
// Using 'googleai/gemini-1.5-flash' is the most robust way to ensure Genkit
// correctly maps the request to the Google AI plugin.
export const geminiModel = 'googleai/gemini-1.5-flash';
