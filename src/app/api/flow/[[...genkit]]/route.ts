
import { GenkitNextRequest, GenkitNextResponse, handleRequest } from "@genkit-ai/next";
import '@/ai/flows/social-link-generator-flow';

export async function POST(req: GenkitNextRequest): Promise<GenkitNextResponse> {
  return handleRequest(req);
}
