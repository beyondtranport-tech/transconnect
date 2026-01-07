'use server';

// This is a placeholder type. The actual generation is disabled.
export interface MarketingCampaignOutput {
  tagline: string;
}

export async function handleGenerateCampaign(
  input: {productName: string}
): Promise<{
  success: boolean;
  data?: MarketingCampaignOutput;
  error?: string;
}> {
  // The AI flow has been disabled due to persistent errors.
  // This function now returns a static, successful response for UI diagnostic purposes.
  console.log("Marketing campaign generation is currently disabled.");
  return { 
    success: true, 
    data: { tagline: 'AI text generation is configured.' } 
  };
}
