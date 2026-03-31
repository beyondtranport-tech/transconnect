
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// This config is safe to share client-side
// The API key is passed explicitly to ensure consistent authentication.
// If AI features fail with a 403 error, ensure the Generative Language API
// is enabled in the Google Cloud project and that billing is active.
export const ai = genkit({
  plugins: [
    googleAI({apiKey: process.env.GEMINI_API_KEY}),
  ],
});
