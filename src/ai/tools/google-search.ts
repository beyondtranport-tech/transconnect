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
    description: 'Performs a Google search to find real-world information. Optimized for fast response times.',
    inputSchema: GoogleSearchInputSchema,
    outputSchema: GoogleSearchOutputSchema,
  },
  async (input: GoogleSearchInput) => {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const cx = process.env.CUSTOM_SEARCH_ENGINE_ID;

    if (!apiKey || apiKey.length < 10) {
      throw new Error('CONFIG_ERROR: GOOGLE_SEARCH_API_KEY is not configured in .env.');
    }
    
    if (!cx || cx.length < 10) {
      throw new Error('CONFIG_ERROR: CUSTOM_SEARCH_ENGINE_ID is not configured in .env.');
    }
    
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(input.query)}`;

    // Tighter timeout for the search API to leave more headroom for the AI processing step
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); 

    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API_ERROR: Google Search failed with status ${response.status}: ${errorData.error?.message || response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.items) {
            return [];
        }

        return data.items.map((item: any) => ({
            title: item.title || 'Untitled',
            link: item.link || '',
            snippet: item.snippet || '',
        }));

    } catch (e: any) {
        clearTimeout(timeoutId);
        if (e.name === 'AbortError') {
            console.warn("[SEARCH TOOL] Google API timed out (6s).");
            throw new Error("SEARCH_TIMEOUT");
        }
        throw e;
    }
  }
);
