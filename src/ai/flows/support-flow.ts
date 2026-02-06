
'use server';
/**
 * @fileOverview An AI-powered customer support agent.
 *
 * - supportQuery - A function that handles a user's support question.
 * - SupportInput - The input type for the supportQuery function.
 * - SupportOutput - The return type for the supportQuery function.
 */

import {ai} from '@/ai/genkit';
import { SupportInputSchema, SupportOutputSchema, type SupportInput, type SupportOutput } from '@/ai/schemas';
import { googleAI } from '@genkit-ai/google-genai';

const systemPrompt = `You are a helpful and friendly AI assistant for Logistics Flow, a digital ecosystem for the logistics industry in South Africa.

Your purpose is to answer user questions about the platform's features and guide them on how to use it.

Key Platform Areas:
- **Divisions:** The platform is organized into main divisions: Funding, Mall, Marketplace, and Tech.
- **Funding:** Helps transporters get asset finance and working capital. To apply, users can go to the Funding division and start an application.
- **Mall:** A collection of specialized marketplaces (Supplier Mall, Transporter Mall, etc.) for parts, services, and vehicles. Collective buying power helps members get discounts.
- **Marketplace & Connect Program:** Allows members to earn recurring revenue by reselling partner products (like insurance) and referring new members.
- **Tech:** Provides tools like an AI Freight Matcher to reduce empty miles.
- **Member Account (/account):** This is the user's main dashboard after logging in, organized with a sidebar menu. Key sections include:
  - **Dashboard:** An overview of their account.
  - **My Profile:** For personal user details.
  - **Company:** For business and banking information required for payouts.
  - **My Shop:** This is where users create and manage their online shop, including adding products and customizing its appearance. This is the primary answer for "how to set up my shop".
  - **AI Marketing Studio:** A suite of AI-powered tools to help users create marketing materials. This includes an AI Image Generator, AI Image Editor, AI Video Generator, and AI Video Animator.
  - **Wallet:** For managing funds, payouts, and viewing transactions. Users can top up via EFT and request payouts to their registered bank account (which must be filled out in the Company section).
- **Admin Backend:** For platform administrators to manage the entire system.

Keep your answers concise, helpful, and encouraging.`;


export async function supportQuery(input: SupportInput): Promise<SupportOutput> {
  return supportFlow(input);
}

const supportFlow = ai.defineFlow(
  {
    name: 'supportFlow',
    inputSchema: SupportInputSchema,
    outputSchema: SupportOutputSchema,
  },
  async (input) => {
    const { history, query } = input;
    
    if (!query) {
        throw new Error("The user's query was empty.");
    }
    
    try {
        const response = await ai.generate({
            model: googleAI.model('gemini-2.5-flash'),
            system: systemPrompt,
            history: history || [], // FIX: Default to an empty array if history is undefined. This prevents the server crash.
            prompt: query,
        });
        
        const textResponse = response.text;
        
        if (!textResponse) {
            throw new Error("The AI model returned an empty or invalid response.");
        }
        
        return { response: textResponse };
    } catch (e: any) {
        console.error("Error inside supportFlow:", e);
        // Propagate a user-friendly error to the frontend.
        throw new Error(`The AI service is currently unavailable. Details: ${e.message}`);
    }
  }
);
