/**
 * @fileOverview Zod schemas and TypeScript types for AI flows.
 * This file does not contain server-only code and can be safely imported by client components.
 */
import { z } from 'zod';

// Schema for Image Generation
export const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt describing the desired image content.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

export const GenerateImageOutputSchema = z.object({
  imageDataUri: z.string().describe('The generated image as a data URI.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;
