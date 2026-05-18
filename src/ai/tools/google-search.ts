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
    description: 'Performs a Google search to find real-world information. Optimized for accuracy and speed.',
    inputSchema: GoogleSearchInputSchema,
    outputSchema: GoogleSearchOutputSchema,
  },
  async (input: GoogleSearchInput) => {
    // Aggressively sanitize inputs
    const sanitize = (val: string | undefined) => 
        val?.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/["']/g, '').trim() || '';

    // Check multiple possible env var locations
    const apiKey = sanitize(process.env.GOOGLE_SEARCH_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY);
    const cx = sanitize(process.env.CUSTOM_SEARCH_ENGINE_ID || process.env.NEXT_PUBLIC_CUSTOM_SEARCH_ENGINE_ID);

    const mask = (s: string) => s.length > 4 ? s.substring(0, 3) + '...' : 'NONE';
    
    if (!apiKey) {
      throw new Error(`CONFIG_ERROR: GOOGLE_SEARCH_API_KEY is missing in your .env file.`);
    }
    
    if (!cx) {
      throw new Error(`CONFIG_ERROR: CUSTOM_SEARCH_ENGINE_ID is missing in your .env file.`);
    }

    // Critical check for the colon format required by Google
    if (!cx.includes(':')) {
      throw new Error(`CONFIG_ERROR: Your Search Engine ID "${mask(cx)}" is invalid. It MUST contain a colon (e.g. "abcdef12345:ghijk"). You likely copied the Name instead of the ID from the Programmable Search Engine control panel.`);
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
                throw new Error(`API_ERROR: Google returned "Invalid Argument". Please ensure your CX ID has no spaces and contains the required colon.`);
            }
            if (response.status === 403) {
                throw new Error(`API_ERROR: Access Denied. Check API key permissions for "Custom Search API" in Google Cloud Console.`);
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
            throw new Error("SEARCH_TIMEOUT");
        }
        throw e;
    }
  }
);
