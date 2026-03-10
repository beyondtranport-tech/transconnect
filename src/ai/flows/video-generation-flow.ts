
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


// Video generation functionality is temporarily disabled due to package incompatibilities.
// This will be re-enabled after an upgrade to Next.js 15.

export async function generateVideo(input: VideoGenerateInput): Promise<VideoGenerateOutput> {  
  return videoGenerateFlow(input);
}

const videoGenerateFlow = ai.defineFlow(
  {
    name: 'videoGenerateFlow',
    inputSchema: VideoGenerateInputSchema,
    outputSchema: VideoGenerateOutputSchema,
  },
  async (input) => {
    throw new Error('Video generation functionality is temporarily unavailable. Please try again later.');
  }
);
