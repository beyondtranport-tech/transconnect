"use server";

import { matchFreight, MatchFreightInput } from '@/ai/flows/ai-freight-matching';

export async function handleMatchFreight(data: MatchFreightInput) {
    try {
        const result = await matchFreight(data);
        return { success: true, data: result };
    } catch (error) {
        console.error("Error in handleMatchFreight:", error);
        return { success: false, error: "Failed to match freight. Please try again." };
    }
}
