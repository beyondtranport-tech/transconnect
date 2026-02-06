'use client';

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import ImageGeneratorCard from "@/app/adminaccount/image-generator-card";
import ImageEditorCard from "@/app/adminaccount/image-editor-card";
import VideoGeneratorCard from "@/app/adminaccount/video-generator-card";
import VideoAnimatorCard from "@/app/adminaccount/video-animator-card";

export default function MarketingStudio() {
  return (
    <div className="space-y-8">
      <CardHeader className="px-0">
          <div className="flex items-center gap-4">
              <Sparkles className="h-8 w-8 text-primary"/>
              <div>
                  <CardTitle>AI Marketing Studio</CardTitle>
                  <CardDescription>
                      Create professional marketing assets for your shop and social media using powerful AI tools.
                  </CardDescription>
              </div>
          </div>
      </CardHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ImageGeneratorCard 
            promptTemplate="A cinematic, professional photograph of a futuristic, gleaming white and green Scania truck driving on a high-tech highway at dusk. The road is illuminated with glowing data lines, and the sky has a vibrant sunset."
        />
        <ImageEditorCard 
            promptTemplate="Place the truck on a winding mountain pass at sunset."
        />
        <VideoGeneratorCard 
            promptTemplate="Create a short, dynamic video showcasing my truck parts shop. Start with a close-up of a shiny chrome exhaust, then show a variety of truck parts on shelves. End with my shop's logo and contact information."
        />
        <VideoAnimatorCard 
            promptTemplate="Take this image of my truck. Animate the wheels spinning and have it drive across the screen from left to right. Add a subtle lens flare and a cinematic feel."
        />
      </div>
    </div>
  );
}
