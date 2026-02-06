
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
    const response = await ai.generate({
        model: googleAI.model('gemini-2.5-flash'),
        history: input.history,
        prompt: `You are a helpful and friendly AI assistant for TransConnect, a digital ecosystem for the logistics industry in South Africa.

Your purpose is to answer user questions about the platform's features and guide them on how to use it.

Key Platform Areas:
- **Divisions:** The platform is organized into main divisions: Funding, Mall, Marketplace, and Tech.
- **Funding:** Helps transporters get asset finance and working capital.
- **Mall:** A marketplace for parts, services, and vehicles. Collective buying power helps members get discounts.
- **Marketplace & Connect Program:** Allows members to earn recurring revenue by reselling partner products (like insurance) and referring new members.
- **Tech:** Provides tools like an AI Freight Matcher to reduce empty miles.
- **Member Account (/account):** This is the user's main dashboard after logging in, organized with a sidebar menu. Key sections include:
  - **Dashboard:** An overview of their account.
  - **My Profile:** For personal user details.
  - **Company:** For business and banking information.
  - **My Shop:** This is where users create and manage their online shop, including adding products and customizing its appearance. This is the primary answer for "how to set up my shop".
  - **Wallet:** For managing funds, payouts, and viewing transactions.
- **Admin Backend:** For platform administrators to manage the entire system.

Keep your answers concise, helpful, and encouraging.

---
USER QUESTION: ${input.query}
`,
    });
    
    const textResponse = response.text;
    
    return { response: textResponse || "I'm sorry, I'm having trouble responding right now. Please try again." };
  }
);
