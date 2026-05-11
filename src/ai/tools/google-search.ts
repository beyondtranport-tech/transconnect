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

    // RESILIENCE FIX: If keys are missing or placeholders, return empty instead of throwing to prevent flow crash.
    if (!apiKey || !cx || apiKey === "YOUR_API_KEY_HERE" || apiKey === "PASTE_YOUR_API_KEY_HERE") {
      console.warn('Google Search API key or Custom Search Engine ID is not configured.');
      return [];
    }
    
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(input.query)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            console.error(`Google Search API error: ${errorData.error?.message}`);
            return [];
        }
        const data = await response.json();
        
        if (!data.items) {
            return [];
        }

        return data.items.map((item: any) => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet,
        }));

    } catch (e: any) {
        console.error("Error calling Google Search API:", e);
        return []; 
    }
  }
);
