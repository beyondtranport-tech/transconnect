
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

// Use a fully qualified string identifier for stability across environments.
export const geminiModel = 'googleai/gemini-1.5-flash';
