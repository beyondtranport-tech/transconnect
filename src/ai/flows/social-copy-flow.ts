'use server';
/**
 * @fileOverview AI Social Media Copywriter for Logistics Flow expansion.
 * Optimized for South African industry groups with standardized high-conversion templates.
 */

import { ai, geminiModel } from '@/ai/genkit';
import { z } from 'genkit';

const SocialCopyInputSchema = z.object({
  audience: z.enum(['transporters', 'suppliers', 'drivers', 'investors']),
  topic: z.enum(['empty_miles', 'capital', 'parts_discounts', 'community_growth', 'general_intro']),
  tone: z.enum(['professional', 'community_casual', 'urgent', 'provocative']),
});
export type SocialCopyInput = z.infer<typeof SocialCopyInputSchema>;

const SocialCopyOutputSchema = z.object({
  posts: z.array(z.object({
    headline: z.string(),
    body: z.string(),
    hashtags: z.array(z.string()),
    imagePrompt: z.string().describe('Prompt for the AI Image generator to create a matching visual.'),
  })).describe('Three distinct post options for social media.'),
});
export type SocialCopyOutput = z.infer<typeof SocialCopyOutputSchema>;

export async function generateSocialCopy(input: SocialCopyInput): Promise<SocialCopyOutput> {
  return socialCopyFlow(input);
}

const socialCopyFlow = ai.defineFlow(
  {
    name: 'socialCopyFlow',
    inputSchema: SocialCopyInputSchema,
    outputSchema: SocialCopyOutputSchema,
  },
  async (input) => {
    const response = await ai.generate({
      model: geminiModel,
      system: `You are an elite social media growth strategist for the South African transport industry.
      Your goal is to write high-engagement Facebook posts that drive signups for "Logistics Flow".
      
      POST STRATEGY & TEMPLATES:
      1. VALUE FIRST: Focus on breaking industry constraints (e.g., high costs, lack of loads).
      2. LOCAL CONTEXT: Use South African industry terms (e.g., "Horses & Trailers", "Bakkie builders", "Rand per KM").
      3. THE "DIRECT-TO-MD" HOOK: Address the owner directly.
      4. CLEAR CTA: End with a placeholder for the tracking link.`,
      prompt: `Generate 3 high-conversion Facebook posts for an audience of ${input.audience}. 
      Topic: ${input.topic} 
      Tone: ${input.tone}. 
      
      Structure:
      - Post 1: The "Operational Pain" Hook (e.g. Empty miles are a tax on your fleet).
      - Post 2: The "Community Growth" Hook (e.g. Strength in numbers, lower tire prices).
      - Post 3: The "Future-Ready" Hook (e.g. AI-powered matching for small hauliers).
      
      Ensure image prompts are professional and ready for Imagen 4.`,
      output: { schema: SocialCopyOutputSchema }
    });
    
    return response.output || { posts: [] };
  }
);
