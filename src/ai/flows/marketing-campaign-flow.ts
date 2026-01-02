'use server';
/**
 * @fileOverview An AI-powered marketing campaign generator.
 *
 * - generateMarketingCampaign - A function that creates marketing campaign ideas.
 * - MarketingBriefInput - The input type for the function.
 * - CampaignIdeaOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MarketingBriefInputSchema = z.object({
  brandName: z.string().describe('The name of the brand or company.'),
  brandDescription: z.string().describe('A short description of the company and its purpose.'),
  keyFeatures: z.array(z.string()).describe('A list of the core features or divisions of the company.'),
});
export type MarketingBriefInput = z.infer<typeof MarketingBriefInputSchema>;

const CampaignIdeaOutputSchema = z.object({
  campaigns: z.array(z.object({
    title: z.string().describe('A catchy, memorable title for the marketing campaign.'),
    targetAudience: z.string().describe('The specific audience this campaign is designed to reach.'),
    keyMessaging: z.string().describe('The core message or value proposition of the campaign.'),
    channels: z.array(z.string()).describe('A list of recommended marketing channels (e.g., Social Media, Email, Industry Publications).'),
  })).describe('A list of three distinct marketing campaign ideas.')
});
export type CampaignIdeaOutput = z.infer<typeof CampaignIdeaOutputSchema>;


export async function generateMarketingCampaign(input: MarketingBriefInput): Promise<CampaignIdeaOutput> {
  return generateMarketingCampaignFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateMarketingCampaignPrompt',
  input: { schema: MarketingBriefInputSchema },
  output: { schema: CampaignIdeaOutputSchema },
  prompt: `You are an expert marketing strategist specializing in the logistics and transportation sector.
  
  Your task is to develop three distinct, creative, and actionable marketing campaign ideas for the following brand:

  **Brand Name:** {{{brandName}}}
  **Brand Description:** {{{brandDescription}}}
  **Core Features/Divisions:**
  {{#each keyFeatures}}
  - {{{this}}}
  {{/each}}

  For each of the three campaigns, you must provide:
  1.  **title**: A catchy, memorable title for the marketing campaign.
  2.  **targetAudience**: The specific audience this campaign is designed to reach (e.g., Owner-Operators, Fleet Managers, Parts Suppliers, Financiers).
  3.  **keyMessaging**: The core message or value proposition of the campaign. What is the main takeaway?
  4.  **channels**: A list of recommended marketing channels (e.g., Social Media, Email, Industry Publications, Events).

  Return the result in the specified JSON format.
  `,
});

const generateMarketingCampaignFlow = ai.defineFlow(
  {
    name: 'generateMarketingCampaignFlow',
    inputSchema: MarketingBriefInputSchema,
    outputSchema: CampaignIdeaOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
