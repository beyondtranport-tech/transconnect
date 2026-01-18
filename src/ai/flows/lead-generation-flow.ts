'use server';
/**
 * @fileOverview An AI agent for generating business leads.
 *
 * - leadGenerationFlow - A function that searches for potential leads based on criteria.
 * - LeadGenerationInput - The input type for the flow.
 * - LeadGenerationOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { LeadGenerationInputSchema, LeadGenerationOutputSchema } from '@/ai/schemas';

// =================================================================
// IMPORTANT: The 'searchWeb' tool below is now configured to use SerpAPI.
// To make this agent fully functional, you must get an API key from
// https://serpapi.com/ and add it to your .env file as SERPAPI_API_KEY.
// If the key is not present, it will fall back to returning mock data.
// =================================================================
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
        const apiKey = process.env.SERPAPI_API_KEY;
        if (!apiKey) {
            console.warn("SERPAPI_API_KEY is not set. The web search will return mock data.");
            // Fallback to mock data if API key is not set
            return [
                { title: "Top Transporters in Gauteng - Logistics SA", link: "https://example.com/1", snippet: "ABC Hauliers, a leading logistics company in Johannesburg... Contact Mike at 011..." },
                { title: "Best Truck Part Suppliers in South Africa", link: "https://example.com/2", snippet: "TruckPro Parts in Germiston offers a wide range... email sales@truckpro.example.com" },
                { title: "Find a Transporter - SA Freight", link: "https://example.com/3", snippet: "Swift Logistics based in Pretoria, contact Sarah on 012... email info@swiftlogistics.example.com" },
            ];
        }

        try {
            console.log(`Performing live web search for: ${query}`);
            const response = await fetch(`https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${apiKey}&engine=google&gl=za&hl=en`);
            
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`SerpAPI request failed with status ${response.status}: ${errorBody}`);
            }

            const searchResults = await response.json() as any;

            if (searchResults.error) {
                throw new Error(`SerpAPI error: ${searchResults.error}`);
            }

            // Map the organic_results to the expected output schema
            return (searchResults.organic_results || []).map((result: any) => ({
                title: result.title,
                link: result.link,
                snippet: result.snippet,
            })).slice(0, 5); // Return top 5 results to keep it concise for the LLM
        } catch (error) {
            console.error("Live web search failed, returning mock data.", error);
            // Fallback to mock data on API failure
            return [
                 { title: "Top Transporters in Gauteng - Logistics SA", link: "https://example.com/1", snippet: "ABC Hauliers, a leading logistics company in Johannesburg... Contact Mike at 011..." },
                { title: "Best Truck Part Suppliers in South Africa", link: "https://example.com/2", snippet: "TruckPro Parts in Germiston offers a wide range... email sales@truckpro.example.com" },
                { title: "Find a Transporter - SA Freight", link: "https://example.com/3", snippet: "Swift Logistics based in Pretoria, contact Sarah on 012... email info@swiftlogistics.example.com" },
            ];
        }
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
    
    const { output } = await ai.generate({
        model: 'googleai/gemini-pro',
        tools: [searchWeb],
        output: {
            schema: LeadGenerationOutputSchema,
        },
        prompt: `You are a lead generation expert for the transport industry. Your task is to find potential leads based on a user's request and structure them into the requested JSON format. Use the provided web search tool to find information.

        User Request: Find ${input.quantity} ${input.role}s in ${location}.
        
        For each lead, please extract the company name, a contact person if available, phone number, and email. Set the status to "new".`,
    });
    
    return output || { leads: [] };
  }
);
