
'use client';

import ImageEditorCard from "./image-editor-card";
import ImageGeneratorCard from "./image-generator-card";

export default function CampaignContent() {

    return (
        <div className="space-y-8">
             <div>
                <h1 className="text-2xl font-bold">AI Marketing Campaigns</h1>
                <p className="mt-2 text-muted-foreground">
                    Leverage AI to generate and enhance marketing assets for your business.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ImageEditorCard />
                <ImageGeneratorCard />
            </div>
        </div>
    )
}
