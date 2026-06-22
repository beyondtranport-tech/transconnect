'use client';

import ImageGeneratorCard from "@/app/backend/image-generator-card";
import ImageEditorCard from "@/app/backend/image-editor-card";
import VideoGeneratorCard from "@/app/backend/video-generator-card";
import IconGeneratorCard from "@/app/backend/icon-generator-card";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Wand2, Video, Film, Palette, BrainCircuit, Globe } from "lucide-react";

// Placeholder for new components
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
        <div className="space-y-8 text-left">
            <CardHeader className="px-0">
                <div className="flex items-center gap-4">
                    <Palette className="h-8 w-8 text-primary"/>
                    <div>
                        <CardTitle className="text-2xl font-black font-headline">AI Content & Branding Studio</CardTitle>
                        <CardDescription>
                            Create professional marketing assets, logos, and high-fidelity video briefings.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Primary Marketing Assets</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <VideoGeneratorCard 
                        title="Ecosystem Overview Video"
                        description="Generate the 60-second 'Platform in Motion' video used in Step 1 (Company Profile) outreach."
                        icon={Globe}
                        presetPrompt="ACT AS A HIGH-END CINEMATIC LOGISTICS BRAND DIRECTOR. Create an 8-second professional marketing sequence for 'Logistics Flow'. SCENE: Start with a dark, high-tech industrial map of South Africa. ACTION: Glowing data points pulse and connect across the provinces (JHB, CPT, DUR). The camera pulls back to reveal a clean, modern dashboard titled 'THE INDUSTRIAL BRAIN' being used in a sleek corporate office. AESTHETIC: High-contrast, forest green and slate grey tones. Professional 4K cinematic look. Focus on precision and connection."
                    />
                    <VideoGeneratorCard 
                        title="Intelligence Briefing Video"
                        description="Generate the high-velocity registry scan video used in Step 0 (Digital Handshake) outreach."
                        icon={BrainCircuit}
                        presetPrompt="SCENE: A close-up of a futuristic glass tablet displaying the Logistics Flow secure registry. ACTION: A fingerprint scan confirms access, and the screen instantly populates with a deep-scroll list of thousands of verified transport company names, direct emails, and mobile numbers. TEXT OVERLAY (Subtle, professional): 'ABSOLUTE TRANSPARENCY'. AESTHETIC: Tech-noir, sharp focus, very high detail on the digital UI elements. Cyber-security and industrial intelligence theme."
                    />
                </div>
            </div>

            <Separator className="my-8" />

            <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">General Creative Tools</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <ImageGeneratorCard />
                    <IconGeneratorCard />
                    <ImageEditorCard />
                    <VideoGeneratorCard />
                    <VideoAnimatorCard />
                </div>
            </div>
        </div>
    );
}

import { Separator } from "@/components/ui/separator";
