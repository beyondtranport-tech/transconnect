'use client';

import ImageGeneratorCard from "@/app/backend/image-generator-card";
import ImageEditorCard from "@/app/backend/image-editor-card";
import VideoGeneratorCard from "@/app/backend/video-generator-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Wand2, Video, Film, Palette } from "lucide-react";

// Placeholder for new components
const IconGeneratorCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon /> AI Icon Generator
        </CardTitle>
        <CardDescription>
          Create custom icons for your app or member shops using a descriptive prompt.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" disabled>Coming Soon</Button>
      </CardContent>
    </Card>
);

const VideoAnimatorCard = () => (
     <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Film /> AI Video Animator
        </CardTitle>
        <CardDescription>
          Bring static images and screenshots to life with a text prompt.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" disabled>Coming Soon</Button>
      </CardContent>
    </Card>
);


export default function BrandingStudio() {
    return (
        <div className="space-y-8">
            <CardHeader className="px-0">
                <div className="flex items-center gap-4">
                    <Palette className="h-8 w-8 text-primary"/>
                    <div>
                        <CardTitle>AI Content & Branding Studio</CardTitle>
                        <CardDescription>
                            Create professional marketing assets, logos, and branding materials using powerful AI tools.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <ImageGeneratorCard />
                <IconGeneratorCard />
                <ImageEditorCard />
                <VideoGeneratorCard />
                <VideoAnimatorCard />
            </div>
        </div>
    );
}
