
import { GenkitNextRequest, GenkitNextResponse, handleRequest } from "@genkit-ai/next";

export async function POST(req: GenkitNextRequest): Promise<GenkitNextResponse> {
  return handleRequest(req);
}
