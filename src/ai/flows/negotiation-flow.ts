
'use server';
/**
 * @fileOverview An AI-powered agent for negotiating commercial agreements with members.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getShopPerformanceTool } from '../tools/shop-performance-tool';
import { getMemberLoyaltyTool } from '../tools/member-loyalty-tool';
import { NegotiationInputSchema, NegotiationOutputSchema } from '../schemas';

export type NegotiationInput = z.infer<typeof NegotiationInputSchema>;
export type NegotiationOutput = z.infer<typeof NegotiationOutputSchema>;

export async function negotiateAgreement(input: NegotiationInput): Promise<NegotiationOutput> {
    return negotiationAgentFlow(input);
}

const negotiationAgentFlow = ai.defineFlow(
    {
        name: 'negotiationAgentFlow',
        inputSchema: NegotiationInputSchema,
        outputSchema: NegotiationOutputSchema,
    },
    async (input) => {
        const { companyId, shopId, proposedRate } = input;

        const response = await ai.generate({
            model: 'gemini-1.5-flash',
            tools: [getShopPerformanceTool, getMemberLoyaltyTool],
            system: `You are a commercial negotiation agent for a logistics platform. Your goal is to evaluate a commission rate proposal from a member for their online shop.

            Platform Standard Commission Rate: 2.5%
            Platform Target Rate (for high-value partners): 1.5%

            Your task is to:
            1. Use the available tools to gather data about the member's shop performance and their loyalty status on the platform.
            2. Analyze this data in conjunction with the member's proposed rate (${proposedRate}%).
            3. Make a decision: 'accept', 'reject', or 'counter'.
            4. Provide a clear justification for your decision, referencing the data you found.
            5. If you make a counter-offer, it must be between the target rate (1.5%) and the standard rate (2.5%).

            Decision Logic:
            - ACCEPT if the proposed rate is at or above the target rate (>= 1.5%) AND the member is a high-value partner (e.g., high sales volume, long-term member, high loyalty tier).
            - REJECT if the proposed rate is excessively low (e.g., < 1.0%) with no strong justification from the member's performance data.
            - COUNTER in most other cases. Propose a fair rate based on the data. For example, a good partner with a low proposal might get a counter-offer of 1.75%. A new partner might get 2.25%.
            `,
            prompt: `Evaluate the proposal from company ${companyId} for shop ${shopId}. They have proposed a commission rate of ${proposedRate}%.`,
            output: {
                schema: NegotiationOutputSchema
            }
        });
        
        const toolCalls = response.toolCalls();
        const toolRequests = response.toolRequests();

        // Basic agent trace for now. In a real scenario, you'd log more detailed info.
        const agentTrace = toolRequests.map(req => `Used tool: ${req.name}`);

        const output = response.output();
        if (!output) {
            throw new Error("The negotiation agent failed to produce a decision.");
        }
        
        return { ...output, agentTrace };
    }
);
