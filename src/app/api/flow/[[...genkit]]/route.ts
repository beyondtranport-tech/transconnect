import { GenkitNextRequest, GenkitNextResponse, handleRequest } from "@genkit-ai/next";

// Import all flow files to register them with Genkit for this API route.
import '@/ai/flows/ai-freight-matching';
import '@/ai/flows/image-edit-flow';
import '@/ai/flows/image-generation-flow';
import '@/ai/flows/lead-research-flow';
import '@/ai/flows/seo-flow';
import '@/ai/flows/social-link-generator-flow';
import '@/ai/flows/support-flow';
import '@/ai/flows/tts-flow';
import '@/ai/flows/video-generation-flow';


export async function POST(req: GenkitNextRequest): Promise<GenkitNextResponse> {
  return handleRequest(req);
}
