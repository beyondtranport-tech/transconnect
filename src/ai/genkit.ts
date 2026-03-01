import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// This is now the single source of truth for AI configuration.
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: false,
});
