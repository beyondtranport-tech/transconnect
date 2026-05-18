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
    // We also remove any invisible characters that can sometimes be copied from the Google Console
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY?.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
    const cx = process.env.CUSTOM_SEARCH_ENGINE_ID?.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();

    if (!apiKey || apiKey.length < 10) {
      throw new Error('CONFIG_ERROR: GOOGLE_SEARCH_API_KEY is missing or invalid in .env.');
    }
    
    if (!cx || cx.length < 10) {
      throw new Error('CONFIG_ERROR: CUSTOM_SEARCH_ENGINE_ID is missing or invalid in .env.');
    }

    if (!input.query || input.query.trim().length === 0) {
        return [];
    }
    
    // Construct URL using standard URL object for robust encoding
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('cx', cx);
    url.searchParams.set('q', input.query.trim());

    console.log(`[SEARCH TOOL] Executing search for: "${input.query.trim()}"`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); 

    try {
        const response = await fetch(url.toString(), { 
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json();
            const apiMessage = errorData.error?.message || response.statusText;
            console.error(`[SEARCH TOOL] Google API Error ${response.status}: ${apiMessage}`);
            
            if (response.status === 400) {
                throw new Error(`API_ERROR: Google returned "Invalid Argument". This usually means your CUSTOM_SEARCH_ENGINE_ID (CX) is incorrect. It should look like "a1b2c3d4e5f6g7h8i:j9k0l1m2n".`);
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
