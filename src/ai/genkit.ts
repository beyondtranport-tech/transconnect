
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// This is now the single source of truth for AI configuration.
export const ai = genkit({
  plugins: [
    googleAI({ 
      projectId: 'transconnect-v1-39578841-2a857',
      location: 'us-central1',
      api: 'vertex' // Explicitly force the use of the Vertex AI backend
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: false,
});
