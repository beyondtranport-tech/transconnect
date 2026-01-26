import { GenkitNextRequest, GenkitNextResponse, handleRequest } from "@genkit-ai/next";
import '@/ai/flows/image-edit-flow';

// This is the correct, standard way to expose Genkit flows as API endpoints in Next.js.
// The [...genkit] slug allows this single route to handle all defined flows.
export async function POST(req: GenkitNextRequest): Promise<GenkitNextResponse> {
  return handleRequest(req);
}
