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
    // Aggressively sanitize inputs by removing quotes and invisible characters
    const sanitize = (val: string | undefined) => 
        val?.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/["']/g, '').trim() || '';

    const apiKey = sanitize(process.env.GOOGLE_SEARCH_API_KEY);
    const cx = sanitize(process.env.CUSTOM_SEARCH_ENGINE_ID);

    // Diagnostic logging (Safe masking)
    const mask = (s: string) => s.length > 6 ? s.substring(0, 3) + '...' + s.substring(s.length - 3) : '****';
    
    console.log(`[SEARCH TOOL] researching: "${input.query.trim()}"`);
    
    if (!apiKey) {
      console.error("[SEARCH TOOL] ERROR: GOOGLE_SEARCH_API_KEY is undefined in process.env");
      throw new Error('CONFIG_ERROR: GOOGLE_SEARCH_API_KEY is missing in .env.');
    }
    
    if (!cx) {
      console.error("[SEARCH TOOL] ERROR: CUSTOM_SEARCH_ENGINE_ID is undefined in process.env");
      throw new Error('CONFIG_ERROR: CUSTOM_SEARCH_ENGINE_ID is missing in .env.');
    }

    if (!cx.includes(':')) {
      console.error(`[SEARCH TOOL] ERROR: CX value "${cx}" is invalid. Must contain a colon.`);
      throw new Error(`CONFIG_ERROR: CUSTOM_SEARCH_ENGINE_ID (CX) is invalid. It must be the alphanumeric ID (e.g. "abc:123"), not the name, and must contain a colon.`);
    }

    console.log(`[SEARCH TOOL] Config verified: CX=${mask(cx)}, Key=${mask(apiKey)}`);

    if (!input.query || input.query.trim().length === 0) {
        return [];
    }
    
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('cx', cx);
    url.searchParams.set('q', input.query.trim());

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
                throw new Error(`API_ERROR: Google returned "Invalid Argument". This often means your CX or API Key has hidden spaces. Please re-type them manually in .env and RESTART the server.`);
            }
            if (response.status === 403) {
                throw new Error(`API_ERROR: Access Denied. Ensure "Custom Search API" is enabled in your Google Cloud Console for project "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}".`);
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