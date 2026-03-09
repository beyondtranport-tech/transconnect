import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// This is now the single source of truth for AI configuration.
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
