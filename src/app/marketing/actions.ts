'use server';

import { generateMarketingCampaign } from '@/ai/flows/marketing-campaign-flow';
import type { MarketingCampaignOutput } from '@/ai/flows/marketing-campaign-flow';

export async function handleGenerateCampaign(input: {
  productName: string;
}): Promise<{
  success: boolean;
  data?: MarketingCampaignOutput;
  error?: string;
}> {
  if (!process.env.GEMINI_API_KEY) {
    return {
      success: false,
      error:
        'GEMINI_API_KEY is not set. Please add it to your .env file.',
    };
  }
  try {
    const result = await generateMarketingCampaign(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in handleGenerateCampaign:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: `Failed to generate campaign: ${errorMessage}` };
  }
}
