
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

export async function generateVideo(input: VideoGenerateInput): Promise<VideoGenerateOutput> {
  
  const promptParts: (string | { text: string } | { media: { url: string, contentType?: string } })[] = [{ text: input.prompt }];
  if (input.imageDataUri) {
      // Logic to extract MIME type from data URI
      const match = input.imageDataUri.match(/^data:(image\/\w+);base64,/);
      const contentType = match ? match[1] : 'image/jpeg';
      promptParts.unshift({ media: { url: input.imageDataUri, contentType: contentType } });
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

  const content = operation.output?.message?.content;
  if (!content) {
    throw new Error('Failed to find content in the video generation operation result.');
  }
  const video = content.find(p => !!p.media);

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
