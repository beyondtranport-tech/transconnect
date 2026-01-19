
'use client';

import CampaignContent from "./campaign-content";

export default function PartnerAiContent() {
    return (
        <div>
            <h1 className="text-3xl font-bold font-headline mb-2">Partner Pitch AI Content Studio</h1>
            <p className="text-lg text-muted-foreground mb-8">Use these tools to generate images and content for your partner outreach materials.</p>
            <CampaignContent />
        </div>
    );
}
