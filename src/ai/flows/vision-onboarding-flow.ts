
'use server';
/**
 * @fileOverview Suggestion 4: Vision-to-Node AI Onboarding.
 * Extracts industrial metadata from RC1 (Registration) or Invoice photos.
 */

import { ai, geminiModel } from '@/ai/genkit';
import { z } from 'genkit';

const VisionOnboardingInputSchema = z.object({
  photoDataUri: z.string().describe("A photo of an industrial document (RC1 or Invoice), as a data URI."),
  docType: z.enum(['rc1', 'invoice']).default('rc1'),
});
export type VisionOnboardingInput = z.infer<typeof VisionOnboardingInputSchema>;

const VisionOnboardingOutputSchema = z.object({
  extraction: z.object({
    make: z.string().nullable(),
    model: z.string().nullable(),
    year: z.string().nullable(),
    vin: z.string().nullable(),
    engineNumber: z.string().nullable(),
    registrationNumber: z.string().nullable(),
    ownerName: z.string().nullable(),
    totalAmount: z.number().nullable().describe('For invoices only.'),
    partsList: z.array(z.string()).nullable().describe('For invoices only.'),
  }),
  confidence: z.number().describe('Extraction confidence score (0-1).'),
  summary: z.string().describe('Brief technical summary of the document.'),
});
export type VisionOnboardingOutput = z.infer<typeof VisionOnboardingOutputSchema>;

export async function runVisionOnboarding(input: VisionOnboardingInput): Promise<VisionOnboardingOutput> {
  return visionOnboardingFlow(input);
}

const visionOnboardingFlow = ai.defineFlow(
  {
    name: 'visionOnboardingFlow',
    inputSchema: VisionOnboardingInputSchema,
    outputSchema: VisionOnboardingOutputSchema,
  },
  async (input) => {
    const response = await ai.generate({
      model: geminiModel,
      system: `ACT AS AN EXPERT INDUSTRIAL AUDITOR. 
      Analyze the provided ${input.docType.toUpperCase()} document and extract the technical metadata into the schema provided. 
      For RC1 (Vehicle Registration): Prioritize VIN, Engine Number, and Make/Model.
      For Invoices: Prioritize Total Amount and the list of parts/services.`,
      prompt: [
        { media: { url: input.photoDataUri } },
        { text: `Extract technical data from this ${input.docType}.` }
      ],
      output: { schema: VisionOnboardingOutputSchema }
    });
    
    return response.output!;
  }
);
