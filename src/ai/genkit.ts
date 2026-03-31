
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// This config is safe to share client-side
// By not passing an API key, Genkit will automatically use the
// Application Default Credentials (ADC) provided by the App Hosting environment.
// We explicitly provide the projectId to ensure it targets the correct project.
// For ADC to work, the "Generative Language API" must be enabled in the
// Google Cloud project and that project must have billing active.
// If AI features fail with a 403 error, follow the `docs/enable-gemini-api.md` guide.
export const ai = genkit({
  plugins: [
    googleAI({ projectId: 'ecosystem-hub' }),
  ],
});
