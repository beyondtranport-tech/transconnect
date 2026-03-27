
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// This config is safe to share client-side
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
