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
    description: 'Performs a Google search to find real-world information. Sourced from global search results.',
    inputSchema: GoogleSearchInputSchema,
    outputSchema: GoogleSearchOutputSchema,
  },
  async (input: GoogleSearchInput) => {
    // Aggressive sanitization to remove any hidden characters, quotes, or whitespace
    const sanitize = (val: string | undefined) => 
        val?.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/["']/g, '').trim() || '';

    const apiKey = sanitize(process.env.GOOGLE_SEARCH_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY);
    const cx = sanitize(process.env.CUSTOM_SEARCH_ENGINE_ID || process.env.NEXT_PUBLIC_CUSTOM_SEARCH_ENGINE_ID);

    // CRITICAL DIAGNOSTIC: Log the found parameters (masked) to the terminal
    // This helps the user verify if the .env file is being read correctly.
    console.log(`[GOOGLE SEARCH] Using API Key: ${apiKey ? apiKey.substring(0, 5) + '...' : 'MISSING'}`);
    console.log(`[GOOGLE SEARCH] Using CX ID: ${cx ? cx.substring(0, 4) + '...' + cx.substring(cx.length - 4) : 'MISSING'}`);

    if (!apiKey) {
      throw new Error(`CONFIG_ERROR: GOOGLE_SEARCH_API_KEY is missing.`);
    }
    
    if (!cx) {
      throw new Error(`CONFIG_ERROR: CUSTOM_SEARCH_ENGINE_ID is missing.`);
    }

    if (!input.query || input.query.trim().length === 0) {
        return [];
    }
    
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('cx', cx);
    url.searchParams.set('q', input.query.trim());

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); 

    try {
        const response = await fetch(url.toString(), { 
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const apiMessage = errorData.error?.message || response.statusText;
            
            if (response.status === 400) {
                throw new Error(`API_ERROR: Google returned "Invalid Argument" (400). This means the CX ID "${cx.substring(0, 4)}..." is incorrect. Ensure you have copied the alphanumeric ID from the "Basics" section of the Control Panel and RESTARTED the server.`);
            }
            
            if (response.status === 403) {
                throw new Error(`API_ERROR: Access Denied. Ensure the "Custom Search API" is enabled in your Google Cloud Console for the project linked to your API Key.`);
            }
            
            throw new Error(`API_ERROR: Google Search failed (${response.status}): ${apiMessage}`);
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
            throw new Error("SEARCH_TIMEOUT: Google Search is taking too long. Please try again.");
        }
        throw e;
    }
  }
);
