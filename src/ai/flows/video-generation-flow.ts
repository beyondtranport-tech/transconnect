'use server';
/**
 * @fileOverview An AI-powered video generation tool using Google's Veo model.
 *
 * - generateVideo - A function that generates a video from a text prompt.
 * - GenerateVideoInput - The input type for the generateVideo function.
 * - GenerateVideoOutput - The return type for the generateVideo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { MediaPart } from 'genkit';
import { Readable } from 'stream';

export const GenerateVideoInputSchema = z.object({
  prompt: z.string().describe('The text prompt describing the desired video content.'),
  durationSeconds: z.number().min(1).max(8).optional().default(5).describe('The duration of the video in seconds.'),
});
export type GenerateVideoInput = z.infer<typeof GenerateVideoInputSchema>;

export const GenerateVideoOutputSchema = z.object({
  videoDataUri: z.string().describe('The generated video as a data URI.'),
});
export type GenerateVideoOutput = z.infer<typeof GenerateVideoOutputSchema>;

// This function will be called from the API route.
export async function generateVideo(input: GenerateVideoInput): Promise<GenerateVideoOutput> {
  return generateVideoFlow(input);
}

// Helper function to convert the video stream to a base64 data URI
async function streamToBase64(stream: NodeJS.ReadableStream): Promise<string> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('base64')));
    });
}


const generateVideoFlow = ai.defineFlow(
  {
    name: 'generateVideoFlow',
    inputSchema: GenerateVideoInputSchema,
    outputSchema: GenerateVideoOutputSchema,
  },
  async ({ prompt, durationSeconds }) => {
    
    // 1. Start the video generation process. This returns an operation, not the final video.
    let { operation } = await ai.generate({
        model: 'googleai/veo-2.0-generate-001',
        prompt: prompt,
        config: {
            durationSeconds: durationSeconds,
            aspectRatio: '16:9',
        },
    });

    if (!operation) {
        throw new Error('Expected the model to return an operation for video generation.');
    }

    // 2. Poll the operation status until it is complete.
    while (!operation.done) {
        // Wait for 5 seconds before checking the status again.
        await new Promise((resolve) => setTimeout(resolve, 5000));
        operation = await ai.checkOperation(operation);
    }

    // 3. Handle completion or error.
    if (operation.error) {
        throw new Error(`Video generation failed: ${operation.error.message}`);
    }

    const video = operation.output?.message?.content.find((p) => !!p.media);
    if (!video?.media?.url) {
        throw new Error('Failed to find the generated video in the operation output.');
    }
    
    // 4. Fetch the video from the signed URL and convert it to a data URI.
    const fetch = (await import('node-fetch')).default;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set.');
    }
    
    // The URL from Veo needs the API key appended to be accessed.
    const videoDownloadResponse = await fetch(`${video.media.url}&key=${apiKey}`);

    if (!videoDownloadResponse.ok || !videoDownloadResponse.body) {
      throw new Error(`Failed to download generated video. Status: ${videoDownloadResponse.status}`);
    }

    const videoBase64 = await streamToBase64(videoDownloadResponse.body);
    const contentType = video.media.contentType || 'video/mp4';

    return {
      videoDataUri: `data:${contentType};base64,${videoBase64}`,
    };
  }
);
