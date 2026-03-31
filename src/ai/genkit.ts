'use client';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// This config is safe to share client-side
// By not passing an API key, Genkit will automatically use the
// Application Default Credentials (ADC) provided by the App Hosting environment.
// If AI features fail with a 403 error, ensure the Generative Language API
// is enabled in the Google Cloud project and that billing is active.
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
