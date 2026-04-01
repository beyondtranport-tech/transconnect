
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// This config uses the GEMINI_API_KEY from your .env file.
// If AI features fail with a 403 or other permission error, ensure that:
// 1. The `GEMINI_API_KEY` is correctly set in your .env file.
// 2. The "Generative Language API" is enabled in your Google Cloud project.
// See `docs/enable-gemini-api.md` for instructions.
export const ai = genkit({
  plugins: [
    googleAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        apiVersion: 'v1',
    }),
  ],
});
