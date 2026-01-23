
'use server';
/**
 * @fileOverview An AI-powered video generation flow.
 *
 * - generateVideo - A function that creates a video based on a text prompt.
 * - VideoGenerateInput - The input type for the generateVideo function.
 * - VideoGenerateOutput - The return type for the generateVideo function.
 */

import { ai } from '@/ai/genkit';
import { VideoGenerateInputSchema, VideoGenerateOutputSchema, type VideoGenerateInput, type VideoGenerateOutput } from '@/ai/schemas';

async function pollOperation(operationName: string) {
    const { google } = require('googleapis');
    const aiplatform = google.aiplatform('v1');
    const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const authClient = await auth.getClient();
    google.options({ auth: authClient });

    return new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
            try {
                const request = new aiplatform.operations.GetRequest({ name: operationName });
                const response = await aiplatform.operations.get(request);

                if (response.data.done) {
                    clearInterval(interval);
                    resolve(response.data);
                }
            } catch (error) {
                clearInterval(interval);
                reject(error);
            }
        }, 5000); // Poll every 5 seconds
    });
}

export async function generateVideo(input: VideoGenerateInput): Promise<VideoGenerateOutput> {
  
  const promptParts: (string | { text: string } | { media: { url: string } })[] = [{ text: input.prompt }];
  if (input.imageDataUri) {
      promptParts.unshift({ media: { url: input.imageDataUri } });
  }

  let { operation } = await ai.generate({
    model: 'googleai/veo-2.0-generate-001',
    prompt: promptParts,
    config: {
      durationSeconds: input.durationSeconds,
      aspectRatio: '16:9',
    },
  });

  if (!operation) {
    throw new Error('Expected the model to return an operation');
  }

  // Polling logic
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // wait 5 seconds
    try {
      operation = await ai.checkOperation(operation);
    } catch(e) {
        console.error("Error checking operation, trying again", e);
    }
  }

  if (operation.error) {
    throw new Error(`Video generation failed: ${operation.error.message}`);
  }

  const video = operation.output?.message?.content.find(p => !!p.media);
  if (!video?.media?.url) {
    throw new Error('Failed to find the generated video in the operation result.');
  }

  // The URL from Veo is temporary and needs the API key to be fetched.
  const videoUrlWithKey = `${video.media.url}&key=${process.env.GEMINI_API_KEY}`;
  const fetch = (await import('node-fetch')).default;
  const videoResponse = await fetch(videoUrlWithKey);

  if (!videoResponse.ok) {
    throw new Error(`Failed to download video file: ${videoResponse.statusText}`);
  }

  const videoBuffer = await videoResponse.arrayBuffer();
  const base64Video = Buffer.from(videoBuffer).toString('base64');
  
  return {
    videoDataUri: `data:video/mp4;base64,${base64Video}`,
  };
}

// This defineFlow is kept for Genkit's internal registry but is not exported.
ai.defineFlow(
  {
    name: 'videoGenerateFlow',
    inputSchema: VideoGenerateInputSchema,
    outputSchema: VideoGenerateOutputSchema,
  },
  generateVideo
);
