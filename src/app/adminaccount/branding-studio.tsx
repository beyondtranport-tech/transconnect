'use client';

import React from 'react';
import ImageGeneratorCard from "@/app/backend/image-generator-card";
import ImageEditorCard from "@/app/backend/image-editor-card";
import VideoGeneratorCard from "@/app/backend/video-generator-card";
import IconGeneratorCard from "@/app/backend/icon-generator-card";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Palette, Ship, Film, Phone, MessageSquare } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
                    <div className="bg-primary/10 p-3 rounded-xl">
                        <Palette className="h-8 w-8 text-primary"/>
                    </div>
                    <div className="text-left">
                        <CardTitle className="text-2xl font-black font-headline">AI Content & Branding Studio</CardTitle>
                        <CardDescription>
                            Produce the 60-second "Driver Narrative" and forensic marketing assets.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <div className="space-y-4 text-left">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">Production Suite: Driver Narrative (Scene-by-Scene)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <VideoGeneratorCard 
                        title="Scene 1: The Harbor Meeting"
                        description="A truck enters a depot near a harbor. Two drivers high-five and start a conversation."
                        icon={Ship}
                        presetPrompt="ACT AS A CINEMATIC FILM DIRECTOR. SCENE: A dusty, high-activity container depot near a major harbor (Durban/Cape Town). ACTION: A modern heavy-duty truck drives into the depot and stops. The driver gets out. Another driver in professional industrial gear walks up. They high-five and begin talking. AESTHETIC: Natural daylight, gritty but professional industrial look. 4K high detail."
                    />
                    <VideoGeneratorCard 
                        title="Scene 2: Forensic Registry"
                        description="A close-up of a futuristic phone displaying the secure industrial registry."
                        icon={Phone}
                        presetPrompt="SCENE: A tight close-up of a futuristic glass mobile device held by a driver. ACTION: A fingerprint scan pulses and confirms access. The screen instantly populates with a deep-scroll list of thousands of verified transport company names, direct emails, and mobile numbers. TEXT OVERLAY (Subtle, professional): 'ABSOLUTE TRANSPARENCY'. AESTHETIC: Tech-noir, sharp focus on the digital UI elements. Cyber-security theme."
                    />
                    <VideoGeneratorCard 
                        title="Scene 3: WhatsApp Outreach"
                        description="Showing the simple generation of a WhatsApp invite link on the device."
                        icon={MessageSquare}
                        presetPrompt="SCENE: Close-up of the mobile device. ACTION: The driver taps a button. A WhatsApp invite link is instantly generated and sent to the second driver's phone. The phone beeps. The screen then shows a 'Product Catalogue' and 'Supplier Registry' search bar. AESTHETIC: Clean UI/UX design, high-velocity movement, modern tech feel."
                    />
                </div>
            </div>

            <Separator className="my-8" />

            <div className="space-y-4 text-left">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">General Creative Tools</h3>
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
