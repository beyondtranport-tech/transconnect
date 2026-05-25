'use server';
/**
 * @fileOverview Google Custom Search Tool for AI Agents.
 * Handles API interactions and provides detailed error feedback for the new "Sites to search" restrictions.
 */

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
    description: 'Performs a targeted Google search across top business directories and social platforms to find real-world company information.',
    inputSchema: GoogleSearchInputSchema,
    outputSchema: GoogleSearchOutputSchema,
  },
  async (input: GoogleSearchInput) => {
    // Sanitize keys to handle accidental copy-pasting of full URLs or extra spaces
    const sanitizeId = (val: string | undefined) => {
        if (!val) return '';
        // If they pasted the full URL like https://.../?cx=123, extract just 123
        const match = val.match(/cx=([a-zA-Z0-9:]+)/);
        if (match) return match[1];
        return val.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
    };

    const apiKey = process.env.GOOGLE_SEARCH_API_KEY?.trim() || '';
    const cx = sanitizeId(process.env.CUSTOM_SEARCH_ENGINE_ID);

    if (process.env.NODE_ENV !== 'production') {
        console.log(`[GOOGLE SEARCH] Requesting query: "${input.query}" using CX: ${cx}`);
    }

    if (!apiKey) {
      throw new Error(`CONFIG_ERROR: GOOGLE_SEARCH_API_KEY is missing from your .env file.`);
    }
    
    if (!cx) {
      throw new Error(`CONFIG_ERROR: CUSTOM_SEARCH_ENGINE_ID is missing from your .env file.`);
    }

    if (!input.query || input.query.trim().length === 0) {
        return [];
    }
    
    // CORRECT ENDPOINT: https://www.googleapis.com/customsearch/v1
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('cx', cx);
    url.searchParams.set('q', input.query.trim());

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); 

    try {
        const response = await fetch(url.toString(), { 
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const apiMessage = errorData.error?.message || response.statusText;
            
            if (response.status === 403) {
                throw new Error(`API_ERROR: Access Denied (403). Ensure the "Custom Search API" is enabled in your Google Cloud Console for project "ecosystem-hub".`);
            }
            
            if (response.status === 404) {
                throw new Error(`API_ERROR: Not Found (404). This usually means your CUSTOM_SEARCH_ENGINE_ID (${cx}) is incorrect. Please verify it in the Google Search Control Panel.`);
            }
            
            if (response.status === 400) {
                throw new Error(`API_ERROR: Invalid Request (400). Please verify your API Key and Search Engine ID.`);
            }
            
            throw new Error(`API_ERROR: Google Search failed (${response.status}): ${apiMessage}`);
        }
        
        const data = await response.json();
        const results = (data.items || []).map((item: any) => ({
            title: item.title || 'Untitled',
            link: item.link || '',
            snippet: item.snippet || '',
        }));

        if (results.length === 0) {
            console.warn(`[GOOGLE SEARCH] Query returned 0 results. This usually means the "Sites to search" list in your Google Control Panel is empty or restricted. Refer to docs/google-search-setup.md.`);
        }

        return results;

    } catch (e: any) {
        clearTimeout(timeoutId);
        if (e.name === 'AbortError') {
            throw new Error("SEARCH_TIMEOUT: Google Search is taking too long. Please try again.");
        }
        throw e;
    }
  }
);
