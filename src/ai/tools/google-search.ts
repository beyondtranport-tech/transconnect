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
    // Aggressively sanitize inputs by removing any non-alphanumeric/non-punctuation characters
    // This removes invisible characters, BOM, and surrounding whitespace often copied from consoles
    const sanitize = (val: string | undefined) => 
        val?.replace(/[\u200B-\u200D\uFEFF]/g, '').trim() || '';

    const apiKey = sanitize(process.env.GOOGLE_SEARCH_API_KEY);
    const cx = sanitize(process.env.CUSTOM_SEARCH_ENGINE_ID);

    if (!apiKey || apiKey.length < 10) {
      throw new Error('CONFIG_ERROR: GOOGLE_SEARCH_API_KEY is missing or too short in .env.');
    }
    
    if (!cx || !cx.includes(':')) {
      throw new Error(`CONFIG_ERROR: CUSTOM_SEARCH_ENGINE_ID (CX) is invalid. It must include a colon (e.g., "abc:123"). You may have copied the name instead of the ID.`);
    }

    if (!input.query || input.query.trim().length === 0) {
        return [];
    }
    
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('cx', cx);
    url.searchParams.set('q', input.query.trim());

    console.log(`[SEARCH TOOL] Researching: "${input.query.trim()}" (CX: ${cx.substring(0, 5)}...)`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
        const response = await fetch(url.toString(), { 
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const apiMessage = errorData.error?.message || response.statusText;
            console.error(`[SEARCH TOOL] Google API ${response.status}: ${apiMessage}`);
            
            if (response.status === 400) {
                throw new Error(`API_ERROR: Google returned "Invalid Argument". Please verify your Search Engine ID (CX) format in .env.`);
            }
            if (response.status === 403) {
                throw new Error(`API_ERROR: Access Denied. Ensure "Custom Search API" is enabled in your Google Cloud Console for project "${process.env.GOOGLE_CLOUD_PROJECT}".`);
            }
            
            throw new Error(`API_ERROR: Google Search failed (${response.status}): ${apiMessage}`);
        }
        
        const data = await response.json();
        
        if (!data.items) {
            console.warn(`[SEARCH TOOL] Zero results for: ${input.query}`);
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
            console.warn("[SEARCH TOOL] Google API timed out (10s).");
            throw new Error("SEARCH_TIMEOUT");
        }
        throw e;
    }
  }
);
