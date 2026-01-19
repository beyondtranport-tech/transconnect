import { config } from 'dotenv';
config();

// CORRECTED: Import the already-configured 'ai' instance.
// Do NOT call configureGenkit() here, as it creates a conflict.
import { ai } from '@/ai/genkit';

// Import all flow files to register them with the single, correct Genkit instance.
// This ensures the dev server and API routes use the same flows.
import '@/ai/flows/ai-freight-matching.ts';
import '@/ai/flows/image-edit-flow.ts';
import '@/ai/flows/image-generation-flow.ts';
import '@/ai/flows/seo-flow.ts';
