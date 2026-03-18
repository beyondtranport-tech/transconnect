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
  return videoGenerateFlow(input);
}

const videoGenerateFlow = ai.defineFlow(
  {
    name: 'videoGenerateFlow',
    inputSchema: VideoGenerateInputSchema,
    outputSchema: VideoGenerateOutputSchema,
  },
  async (input: VideoGenerateInput) => {
    const { prompt, imageDataUri, durationSeconds } = input;
    
    const promptParts: any[] = [{ text: prompt }];
    if (imageDataUri) {
      promptParts.push({ media: { url: imageDataUri } });
    }
    
    let { operation } = await ai.generate({
      model: 'googleai/veo-2.0-generate-001',
      prompt: promptParts,
      config: {
        durationSeconds: durationSeconds || 5,
        aspectRatio: '16:9',
      },
    });
  
    if (!operation) {
      throw new Error('Expected the model to return an operation');
    }
  
    // Wait until the operation completes.
    while (!operation.done) {
      operation = await ai.checkOperation(operation);
      // Sleep for 5 seconds before checking again.
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  
    if (operation.error) {
      throw new Error('Failed to generate video: ' + operation.error.message);
    }
  
    const video = operation.output?.message?.content.find((p: any) => !!p.media);
    if (!video) {
      throw new Error('Failed to find the generated video in the operation output.');
    }

    // The Veo API returns a URL that needs an API key to download.
    // We'll fetch it on the server and convert it to a data URI to send to the client.
    const fetch = (await import('node-fetch')).default;
    const videoDownloadResponse = await fetch(
        `${video.media!.url}&key=${process.env.GEMINI_API_KEY}`
    );

    if (!videoDownloadResponse.ok || !videoDownloadResponse.body) {
        throw new Error(`Failed to download generated video. Status: ${videoDownloadResponse.status}`);
    }
    
    const buffer = await videoDownloadResponse.buffer();
    const base64Video = buffer.toString('base64');
    
    return { videoDataUri: `data:video/mp4;base64,${base64Video}` };
  }
);
