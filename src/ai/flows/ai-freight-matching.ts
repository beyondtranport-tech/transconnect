'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MatchFreightInputSchema = z.object({
  location: z.string().min(1, "Please select an origin."),
  destination: z.string().min(1, "Please select a destination."),
  vehicleType: z.string().min(1, "Please select a vehicle type."),
  capacity: z.string().min(1, "Please enter vehicle capacity."),
  preferences: z.string().optional(),
  rate: z.number().positive().optional(),
  isPartLoad: z.boolean().optional(),
  palletCount: z.number().int().positive().optional(),
});

const MatchFreightOutputSchema = z.object({
  matches: z.array(
    z.object({
      loadId: z.string().describe('The ID of the freight load.'),
      origin: z.string().describe('The origin location of the freight load.'),
      destination: z.string().describe('The destination location of the freight load.'),
      weight: z.string().describe('The weight of the freight load.'),
      size: z.string().describe('The size of the freight load.'),
      price: z.string().describe('The price offered for the freight load.'),
      requirements: z.string().optional().describe('Any special requirements for the freight load.'),
    })
  ).describe('A list of freight loads that match the transporter criteria.'),
});


export type MatchFreightInput = z.infer<typeof MatchFreightInputSchema>;
export type MatchFreightOutput = z.infer<typeof MatchFreightOutputSchema>;


export async function matchFreight(input: MatchFreightInput): Promise<MatchFreightOutput> {
  return matchFreightFlow(input);
}

const matchFreightFlow = ai.defineFlow(
  {
    name: 'matchFreightFlow',
    inputSchema: MatchFreightInputSchema,
    outputSchema: MatchFreightOutputSchema,
  },
  async (input: MatchFreightInput) => {

    // Build a more detailed prompt based on user input.
    let prompt = `You are an AI assistant specialized in matching freight loads with transporters.

        Given the following information about a transporter:
        - Origin Location: ${input.location}
        - Destination: ${input.destination}
        - Vehicle Type: ${input.vehicleType}
        - Total Vehicle Capacity: ${input.capacity}`;
    
    if (input.rate) {
        prompt += `
        - Desired Rate: R${input.rate} per kilometer`;
    }

    if (input.isPartLoad && input.palletCount) {
        prompt += `
        - Load Type: This is a PART LOAD. The transporter has space for approximately ${input.palletCount} pallets (roughly ${input.palletCount} tons).`;
    } else {
        prompt += `
        - Load Type: Looking for a FULL LOAD.`;
    }
    
    if (input.preferences) {
        prompt += `
        - Other Preferences: ${input.preferences}`;
    }

    prompt += `

Find available freight loads that match these criteria. Critically, if it is a part load, only return loads that would fit the specified palletCount.`;

    const response = await ai.generate({
        model: 'gemini-1.5-flash',
        prompt: prompt,
        output: {
            schema: MatchFreightOutputSchema
        }
    });
    
    return response.output || { matches: [] };
  }
);
