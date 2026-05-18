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
    // Sanitize inputs by trimming any accidental whitespace or newlines from .env
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY?.trim();
    const cx = process.env.CUSTOM_SEARCH_ENGINE_ID?.trim();

    if (!apiKey || apiKey.length < 10) {
      throw new Error('CONFIG_ERROR: GOOGLE_SEARCH_API_KEY is missing or invalid in .env.');
    }
    
    if (!cx || cx.length < 10) {
      throw new Error('CONFIG_ERROR: CUSTOM_SEARCH_ENGINE_ID is missing or invalid in .env.');
    }
    
    // Construct URL with encoded query
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(input.query)}`;

    console.log(`[SEARCH TOOL] Executing search for: "${input.query}"`);

    // Tighter timeout for the search API to leave more headroom for the AI processing step
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); 

    try {
        const response = await fetch(url, { 
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json();
            const apiMessage = errorData.error?.message || response.statusText;
            console.error(`[SEARCH TOOL] Google API Error ${response.status}: ${apiMessage}`);
            
            // Provide specific guidance for common errors
            if (response.status === 400) {
                throw new Error(`API_ERROR: Google returned "Invalid Argument". Please re-check your CUSTOM_SEARCH_ENGINE_ID and API Key in .env for extra spaces or incorrect characters.`);
            }
            if (response.status === 403) {
                throw new Error(`API_ERROR: Access Denied. Ensure the Custom Search API is enabled in your Google Cloud Console.`);
            }
            
            throw new Error(`API_ERROR: Google Search failed (${response.status}): ${apiMessage}`);
        }
        
        const data = await response.json();
        
        if (!data.items) {
            console.warn(`[SEARCH TOOL] No results found for: ${input.query}`);
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
