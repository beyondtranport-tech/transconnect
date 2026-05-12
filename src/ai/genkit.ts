
import {genkit} from 'genkit';
import {googleAI, gemini15Flash} from '@genkit-ai/google-genai';

// This config uses the GEMINI_API_KEY from your .env file.
export const ai = genkit({
  plugins: [
    googleAI({ 
        apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
});

// Export the verified model constant for consistency across all flows.
export const geminiModel = gemini15Flash;
