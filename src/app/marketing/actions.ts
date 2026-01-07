'use server';

import { generateImageFlow } from "@/ai/flows/image-generation-flow";
import type { GenerateImageInput, GenerateImageOutput } from "@/ai/flows/schemas";

export async function handleGenerateCampaign(input: GenerateImageInput): Promise<{ success: boolean; data?: GenerateImageOutput; error?: string; }> {
    if (!process.env.GEMINI_API_KEY) {
        return { success: false, error: "GEMINI_API_KEY is not set. Please add it to your .env file." };
    }
    try {
        const result = await generateImageFlow(input);
        
        // The flow now directly returns the output object which matches GenerateImageOutput
        return { success: true, data: result };

    } catch (error) {
        console.error("Error in handleGenerateCampaign:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to generate campaign: ${errorMessage}` };
    }
}
