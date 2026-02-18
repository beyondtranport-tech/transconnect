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
            promptTemplate="A modern, minimalist logo for a logistics company named 'Logistics Flow'. The design should feature an abstract representation of a truck or arrow, conveying movement and efficiency. Use a clean color palette of forest green and charcoal gray."
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
