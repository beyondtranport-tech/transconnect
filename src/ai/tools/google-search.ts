'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GoogleSearchInputSchema = z.object({
  query: z.string().describe('The search query.'),
});
type GoogleSearchInput = z.infer<typeof GoogleSearchInputSchema>;

const GoogleSearchResultSchema = z.object({
    title: z.string(),
    link: z.string(),
    snippet: z.string(),
});

const GoogleSearchOutputSchema = z.array(GoogleSearchResultSchema);

export const googleSearchTool = ai.defineTool(
  {
    name: 'googleSearch',
    description: 'Performs a Google search to find real-world information, such as companies, addresses, and websites. Use this to find real companies based on a topic.',
    inputSchema: GoogleSearchInputSchema,
    outputSchema: GoogleSearchOutputSchema,
  },
  async (input: GoogleSearchInput) => {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const cx = process.env.CUSTOM_SEARCH_ENGINE_ID;

    // DIAGNOSTIC CHECK: Log configuration status
    console.log(`Google Search Tool Executing: Query="${input.query}"`);

    if (!apiKey || apiKey === "YOUR_API_KEY_HERE" || apiKey.includes("PASTE")) {
      throw new Error('CONFIG_ERROR: GOOGLE_SEARCH_API_KEY is not configured correctly in .env.');
    }
    
    if (!cx || cx === "YOUR_NEW_SEARCH_ENGINE_ID_HERE" || cx.includes("PASTE")) {
      throw new Error('CONFIG_ERROR: CUSTOM_SEARCH_ENGINE_ID is not configured correctly in .env.');
    }
    
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(input.query)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            const message = errorData.error?.message || response.statusText;
            console.error(`Google Search API error: ${message}`);
            throw new Error(`API_ERROR: Google Search failed with status ${response.status}: ${message}`);
        }
        const data = await response.json();
        
        if (!data.items) {
            console.log(`Google Search Tool: No results returned for query.`);
            return [];
        }

        return data.items.map((item: any) => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet,
        }));

    } catch (e: any) {
        console.error("Error calling Google Search API:", e);
        throw e;
    }
  }
);
