import { z } from 'zod';

// From ai-freight-matching.ts
export const MatchFreightInputSchema = z.object({
  location: z.string().describe('The current location of the transporter.'),
  vehicleType: z.string().describe('The type of vehicle the transporter has (e.g., truck, van).'),
  capacity: z.string().describe('The carrying capacity of the vehicle.'),
  preferences: z.string().optional().describe('Any specific preferences or requirements of the transporter.'),
});
export type MatchFreightInput = z.infer<typeof MatchFreightInputSchema>;

export const MatchFreightOutputSchema = z.object({
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
export type MatchFreightOutput = z.infer<typeof MatchFreightOutputSchema>;


// From image-edit-flow.ts
export const ImageEditInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to edit, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  prompt: z.string().describe('The text prompt describing the desired edit.'),
});
export type ImageEditInput = z.infer<typeof ImageEditInputSchema>;

export const ImageEditOutputSchema = z.object({
  enhancedImageDataUri: z
    .string()
    .describe('The edited image as a data URI.'),
});
export type ImageEditOutput = z.infer<typeof ImageEditOutputSchema>;

// From image-generation-flow.ts
export const ImageGenerateInputSchema = z.object({
  prompt: z.string().describe('The text prompt describing the desired image.'),
});
export type ImageGenerateInput = z.infer<typeof ImageGenerateInputSchema>;

export const ImageGenerateOutputSchema = z.object({
  imageDataUri: z
    .string()
    .describe('The generated image as a data URI.'),
});
export type ImageGenerateOutput = z.infer<typeof ImageGenerateOutputSchema>;

// From seo-flow.ts
export const ShopSeoInputSchema = z.object({
  shopName: z.string().describe('The name of the online shop.'),
  shopDescription: z.string().describe('A brief description of the shop and what it sells.'),
});
export type ShopSeoInput = z.infer<typeof ShopSeoInputSchema>;

export const ShopSeoOutputSchema = z.object({
    metaTitle: z.string().describe('An SEO-optimized title for the shop page, under 60 characters.'),
    metaDescription: z.string().describe('An SEO-optimized meta description, under 160 characters.'),
    tags: z.array(z.string()).describe('A list of 5-7 relevant SEO keywords or tags for the shop.'),
});
export type ShopSeoOutput = z.infer<typeof ShopSeoOutputSchema>;

// From lead-research-flow.ts
export const LeadResearchInputSchema = z.object({
  topic: z.string().describe('The research topic or query for lead generation (e.g., "logistics companies in Cape Town").'),
  quantity: z.coerce.number().min(1).max(10).describe('The number of leads to generate.'),
});
export type LeadResearchInput = z.infer<typeof LeadResearchInputSchema>;

export const LeadResearchOutputSchema = z.object({
    leads: z.array(z.object({
        companyName: z.string().describe('The name of the potential lead company.'),
        role: z.string().describe('The likely role of this company in the ecosystem (e.g., Vendor, Buyer, Partner).'),
        address: z.string().optional().describe("The company's physical address, if found."),
        website: z.string().url().nullable().optional().describe("The company's website URL, if found."),
        phone: z.string().optional().describe("The company's primary phone number, if found."),
        email: z.string().email().nullable().optional().describe("A general contact email for the company (e.g., info@, sales@), if found."),
        contactPerson: z.string().optional().describe("A potential contact person's name, if found."),
    })).describe('A list of potential leads based on the research topic.')
});
export type LeadResearchOutput = z.infer<typeof LeadResearchOutputSchema>;
