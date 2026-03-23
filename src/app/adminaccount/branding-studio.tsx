
'use client';

import ImageGeneratorCard from "@/app/backend/image-generator-card";
import ImageEditorCard from "@/app/backend/image-editor-card";
import VideoGeneratorCard from "@/app/backend/video-generator-card";

export default function BrandingStudio() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ImageGeneratorCard />
            <ImageEditorCard />
            <VideoGeneratorCard />
        </div>
    );
}
