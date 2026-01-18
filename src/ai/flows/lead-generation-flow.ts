'use server';
/**
 * @fileOverview An AI agent for generating business leads.
 *
 * - leadGenerationFlow - A function that searches for potential leads based on criteria.
 * - LeadGenerationInput - The input type for the flow.
 * - LeadGenerationOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const LeadSchema = z.object({
    id: z.string().optional(),
    companyName: z.string(),
    contactPerson: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    role: z.string(),
    status: z.enum(['new', 'contacted', 'qualified', 'unqualified']),
    notes: z.string().optional(),
});
export type Lead = z.infer<typeof LeadSchema>;

export const LeadGenerationInputSchema = z.object({
  role: z.string().describe('The role of the potential member, e.g., Vendor, Buyer, Transporter.'),
  region: z.string().describe('The geographical province to search in, e.g., Gauteng, Western Cape.'),
  city: z.string().optional().describe('The specific city or town to search in.'),
  quantity: z.number().min(1).max(10).default(5).describe('The number of leads to generate.'),
});
export type LeadGenerationInput = z.infer<typeof LeadGenerationInputSchema>;

export const LeadGenerationOutputSchema = z.object({
  leads: z.array(LeadSchema).describe('An array of generated leads.'),
});
export type LeadGenerationOutput = z.infer<typeof LeadGenerationOutputSchema>;


// This is a placeholder tool. In a real-world scenario, you would replace this
// with a tool that calls a real search API (e.g., Google Custom Search, SerpAPI).
const searchWeb = ai.defineTool(
    {
        name: 'searchWeb',
        description: 'Searches the web for information based on a query.',
        inputSchema: z.string(),
        outputSchema: z.array(z.object({
            title: z.string(),
            link: z.string(),
            snippet: z.string(),
        })),
    },
    async (query) => {
        console.log(`[Placeholder Search] Searching for: ${query}`);
        // Returning mock data to simulate a web search
        return [
            { title: "Top Transporters in Gauteng - Logistics SA", link: "https://example.com/1", snippet: "ABC Hauliers, a leading logistics company in Johannesburg... Contact Mike at 011..." },
            { title: "Best Truck Part Suppliers in South Africa", link: "https://example.com/2", snippet: "TruckPro Parts in Germiston offers a wide range... email sales@truckpro.example.com" },
            { title: "Find a Transporter - SA Freight", link: "https://example.com/3", snippet: "Swift Logistics based in Pretoria, contact Sarah on 012... email info@swiftlogistics.example.com" },
        ];
    }
);


export const leadGenerationFlow = ai.defineFlow(
  {
    name: 'leadGenerationFlow',
    inputSchema: LeadGenerationInputSchema,
    outputSchema: LeadGenerationOutputSchema,
  },
  async (input) => {
    const location = `${input.city ? `${input.city}, ` : ''}${input.region}`;
    const searchQuery = `Find ${input.quantity} ${input.role} businesses in ${location}, South Africa`;

    const llmResponse = await ai.generate({
        model: 'googleai/gemini-pro',
        prompt: `You are a lead generation expert for the transport industry. Your task is to find potential leads based on a user's request and structure them into the requested JSON format. Use the provided web search tool to find information.

        User Request: Find ${input.quantity} ${input.role}s in ${location}.
        
        For each lead, please extract the company name, a contact person if available, phone number, and email. Set the status to "new".`,
        tools: [searchWeb],
        output: {
            format: 'json',
            schema: LeadGenerationOutputSchema,
        }
    });

    return llmResponse.output || { leads: [] };
  }
);
