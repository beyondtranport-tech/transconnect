'use client';

import ImageEditorCard from "./image-editor-card";
import ImageGeneratorCard from "./image-generator-card";

export default function CampaignContent() {

    return (
        <div className="space-y-8">
             <div>
                <h1 className="text-2xl font-bold">Sales & Marketing AI Studio</h1>
                <p className="mt-2 text-muted-foreground">
                    Use these tools to generate and enhance visual assets for your sales and marketing campaigns.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ImageGeneratorCard />
                <ImageEditorCard />
            </div>
        </div>
    )
}
