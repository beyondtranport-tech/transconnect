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
    // Robust sanitization to remove any hidden characters, quotes, or whitespace
    const sanitize = (val: string | undefined) => 
        val?.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/["']/g, '').trim() || '';

    const apiKey = sanitize(process.env.GOOGLE_SEARCH_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY);
    const cx = sanitize(process.env.CUSTOM_SEARCH_ENGINE_ID || process.env.NEXT_PUBLIC_CUSTOM_SEARCH_ENGINE_ID);

    // Terminal Diagnostics: Masked log to verify ID loading
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[GOOGLE SEARCH] Using API Key: ${apiKey ? apiKey.substring(0, 5) + '...' : 'MISSING'}`);
        console.log(`[GOOGLE SEARCH] Using CX ID: ${cx ? cx.substring(0, 6) + '...' : 'MISSING'}`);
    }

    if (!apiKey) {
      throw new Error(`CONFIG_ERROR: GOOGLE_SEARCH_API_KEY is missing from environment.`);
    }
    
    if (!cx) {
      throw new Error(`CONFIG_ERROR: CUSTOM_SEARCH_ENGINE_ID is missing from environment.`);
    }

    if (!input.query || input.query.trim().length === 0) {
        return [];
    }
    
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('cx', cx);
    url.searchParams.set('q', input.query.trim());

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout

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
                throw new Error(`API_ERROR: Google returned "Invalid Argument" (400). Found CX ID: "${cx.substring(0, 4)}...". Ensure this is the alphanumeric ID from the "Basics" section of the Control Panel.`);
            }
            
            if (response.status === 403) {
                throw new Error(`API_ERROR: Access Denied (403). Ensure "Custom Search API" is enabled in your Google Cloud Project.`);
            }
            
            throw new Error(`API_ERROR: Google Search failed (${response.status}): ${apiMessage}`);
        }
        
        const data = await response.json();
        return (data.items || []).map((item: any) => ({
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
