import { config } from 'dotenv';
config();

// CORRECTED: Import the already-configured 'ai' instance.
// Do NOT call configureGenkit() here, as it creates a conflict.
import { ai } from '@/ai/genkit';

// Import all flow files to register them with the single, correct Genkit instance.
// This ensures the dev server and API routes use the same flows.
import '@/ai/flows/ai-freight-matching.ts';
import '@/ai/flows/seo-flow.ts';
import '@/ai/flows/image-enhancement-flow.ts';
import '@/ai/flows/video-generation-flow.ts';
import '@/ai/flows/marketing-campaign-flow.ts';
