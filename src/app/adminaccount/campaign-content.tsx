
'use client';

import ImageEditorCard from "./image-editor-card";
import ImageGeneratorCard from "./image-generator-card";
import VideoGeneratorCard from "./video-generator-card";

export default function CampaignContent({
  title,
  description,
  imageGeneratorPrompt,
  imageEditorPrompt,
  videoGeneratorPrompt,
}: {
  title: string;
  description: string;
  imageGeneratorPrompt?: string;
  imageEditorPrompt?: string;
  videoGeneratorPrompt?: string;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <ImageGeneratorCard promptTemplate={imageGeneratorPrompt} />
        <ImageEditorCard promptTemplate={imageEditorPrompt} />
        <VideoGeneratorCard promptTemplate={videoGeneratorPrompt} />
      </div>
    </div>
  );
}
