'use server';
/**
 * @fileOverview Google Custom Search Tool for AI Agents.
 * Handles API interactions and provides detailed error feedback for quota management.
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
    const sanitizeId = (val: string | undefined) => {
        if (!val) return '';
        const match = val.match(/cx=([a-zA-Z0-9:]+)/);
        if (match) return match[1];
        return val.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
    };

    const apiKey = process.env.GOOGLE_SEARCH_API_KEY?.trim() || '';
    const cx = sanitizeId(process.env.CUSTOM_SEARCH_ENGINE_ID);

    if (!apiKey) throw new Error(`CONFIG_ERROR: GOOGLE_SEARCH_API_KEY missing.`);
    if (!cx) throw new Error(`CONFIG_ERROR: CUSTOM_SEARCH_ENGINE_ID missing.`);
    if (!input.query || input.query.trim().length === 0) return [];
    
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
            
            // SPECIFIC QUOTA DETECTION
            if (response.status === 429 || apiMessage.toLowerCase().includes('quota')) {
                throw new Error(`SEARCH_QUOTA_EXHAUSTED: You have exceeded the daily Google Search limit (100 requests). Please stop automated tasks and wait until tomorrow.`);
            }
            if (response.status === 403) {
                throw new Error(`API_ERROR: Access Denied (403). Ensure the "Custom Search API" is enabled in your Google Cloud Console.`);
            }
            if (response.status === 404) {
                throw new Error(`API_ERROR: Not Found (404). Your CUSTOM_SEARCH_ENGINE_ID (${cx}) might be incorrect.`);
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
        if (e.name === 'AbortError') throw new Error("SEARCH_TIMEOUT: Google Search is taking too long.");
        throw e;
    }
  }
);