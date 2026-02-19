
'use client';

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import ImageGeneratorCard from "./image-generator-card";
import ImageEditorCard from "./image-editor-card";
import VideoGeneratorCard from "./video-generator-card";
import VideoAnimatorCard from "./video-animator-card";

export default function MarketingStudio() {
  return (
    <div className="space-y-8">
      <CardHeader className="px-0">
          <div className="flex items-center gap-4">
              <Sparkles className="h-8 w-8 text-primary"/>
              <div>
                  <CardTitle>AI Content & Branding Studio</CardTitle>
                  <CardDescription>
                      Create professional marketing assets, logos, and branding materials using powerful AI tools.
                  </CardDescription>
              </div>
          </div>
      </CardHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ImageGeneratorCard 
            promptTemplate={`// A prompt for generating a clean, modern icon.
// Edit the details below to customize your icon.

A simple, modern icon representing [concept, e.g., 'fast delivery' or 'secure storage'].

// Describe the style.
// Examples: 'flat icon style', 'vector art', 'line art icon'.
Style: flat icon style, with clean lines and minimal detail.

// Describe the color palette.
// Example: 'using a palette of blues and grays', 'in the primary brand color of green'.
Color: using the brand colors of forest green and charcoal gray.

// Add any other details.
// Example: 'The icon should be on a transparent background', 'It should be easily recognizable at small sizes'.
The icon should be on a white background, enclosed in a circle with a thin gray border.`}
        />
        <ImageEditorCard 
            promptTemplate="Place the truck on a winding mountain pass at sunset."
        />
        <VideoGeneratorCard 
            promptTemplate="Create a short, dynamic video showcasing a logistics company. Start with a close-up of a truck's wheels turning, then show a variety of trucks on the highway. End with a company logo and contact information."
        />
        <VideoAnimatorCard 
            promptTemplate="Take this image of our company logo. Animate it with a subtle glowing effect and have the abstract arrow element move forward slightly."
        />
      </div>
    </div>
  );
}
