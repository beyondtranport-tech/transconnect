'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Wand2, Users, MessageSquare, Megaphone } from 'lucide-react';
import { handleGenerateCampaign } from './actions';
import type { CampaignIdeaOutput } from '@/ai/flows/marketing-campaign-flow';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const brandBrief = {
    brandName: "TransConnect",
    brandDescription: "An interconnected ecosystem for the transport industry, offering funding, a marketplace for parts and services (the Mall), and advanced technology like AI freight matching.",
    keyFeatures: ["Funding Division", "Mall Division (Supplier, Transporter, etc.)", "Marketplace Division (Resellers)", "Tech Division (AI Tools)"]
};

export default function MarketingPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [campaigns, setCampaigns] = useState<CampaignIdeaOutput | null>(null);
    const { toast } = useToast();

    const generateCampaigns = async () => {
        setIsLoading(true);
        setCampaigns(null);
        const result = await handleGenerateCampaign(brandBrief);
        if (result.success) {
            setCampaigns(result.data);
        } else {
            toast({
                variant: 'destructive',
                title: 'Generation Failed',
                description: result.error,
            });
        }
        setIsLoading(false);
    };

    // Auto-generate on page load
    useEffect(() => {
        generateCampaigns();
    }, []);

    return (
        <div className="container mx-auto px-4 py-16">
            <Card className="max-w-5xl mx-auto">
                <CardHeader className="text-center">
                    <div className="inline-block bg-primary/10 p-4 rounded-full mb-4 w-fit mx-auto">
                        <Wand2 className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="text-4xl font-bold font-headline">AI Marketing Strategist</CardTitle>
                    <CardDescription className="text-lg text-muted-foreground mt-2">
                        Your on-demand marketing assistant. Generate complete campaign ideas for TransConnect with a single click.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center mb-10">
                        <Button onClick={generateCampaigns} disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="mr-2 h-4 w-4" />
                            )}
                            Generate New Campaign Ideas
                        </Button>
                    </div>

                     {isLoading && (
                        <div className="text-center py-10">
                            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                            <p className="mt-4 text-muted-foreground">Pomelli is thinking...</p>
                        </div>
                    )}
                    
                    {campaigns && (
                        <div className="space-y-8">
                            {campaigns.campaigns.map((campaign, index) => (
                                <Card key={index} className="bg-background">
                                    <CardHeader>
                                        <CardTitle className="text-2xl text-primary">{campaign.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold flex items-center gap-2"><Users className="h-5 w-5 text-muted-foreground" />Target Audience</h4>
                                            <p className="text-muted-foreground pl-7">{campaign.targetAudience}</p>
                                        </div>
                                         <div>
                                            <h4 className="font-semibold flex items-center gap-2"><MessageSquare className="h-5 w-5 text-muted-foreground" />Key Messaging</h4>
                                            <p className="text-muted-foreground pl-7">{campaign.keyMessaging}</p>
                                        </div>
                                         <div>
                                            <h4 className="font-semibold flex items-center gap-2"><Megaphone className="h-5 w-5 text-muted-foreground" />Suggested Channels</h4>
                                            <div className="flex flex-wrap gap-2 pl-7 mt-1">
                                                {campaign.channels.map(channel => (
                                                    <Badge key={channel} variant="secondary">{channel}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}
