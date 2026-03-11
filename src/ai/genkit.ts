
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const plugins = [];

// Conditionally initialize the googleAI plugin only if the API key exists.
// This prevents the server from crashing on startup if the key is not set.
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_API_KEY_HERE') {
  plugins.push(googleAI());
}

export const ai = genkit({
  plugins,
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
