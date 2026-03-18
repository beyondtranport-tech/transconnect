'use server';

import {genkit} from '@genkit-ai/core';
import {googleAI} from '@genkit-ai/google-genai';
import {firebase} from '@genkit-ai/firebase';

// This config is safe to share client-side
export const ai = genkit({
  plugins: [
    googleAI({
        apiVersion: 'v1beta', // Required for advanced features
    }),
    firebase(), // Required for Firebase integration
  ],
});
