'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import NanoBananaCard from './nano-banana-card';
import AIImageGeneratorCard from './image-generator-card';

export default function CampaignContent() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Campaign Creation Tools</h1>
                <p className="mt-2 text-muted-foreground">
                    Leverage AI to create stunning marketing assets for your business.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <NanoBananaCard />
                <AIImageGeneratorCard />
                {/* Other campaign tool cards will go here */}
            </div>
        </div>
    );
}
