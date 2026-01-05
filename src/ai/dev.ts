import { config } from 'dotenv';
config();

import { configureGenkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { genkit, ai } from './genkit'; // Import the ai instance

// Configure Genkit with the Google AI plugin
configureGenkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  // Log developer-friendly errors to the console
  logLevel: 'debug',
  // Omit the flow-state history from the logs
  enableTracingAndMetrics: true,
});

// Import all the flow files to register them with Genkit
import '@/ai/flows/ai-freight-matching.ts';
import '@/ai/flows/seo-flow.ts';
import '@/ai/flows/marketing-campaign-flow.ts';
import '@/ai/flows/image-enhancement-flow.ts';
import '@/ai/flows/video-generation-flow.ts';
import '@/ai/flows/image-generation-flow.ts';
