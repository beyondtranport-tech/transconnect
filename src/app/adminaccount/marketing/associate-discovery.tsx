
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, ClipboardCheck, Terminal, Database, ShieldCheck, Share2, Info, UserCheck, Zap, Target, Palette, Video, Star, AlertTriangle } from "lucide-react";
import * as React from "react";
import { useState, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const associateCategories = [
    "Digital Influencer",
    "Content Creator",
    "Digital Marketer",
    "Brand Strategist",
    "Industry Influencer",
    "Social Growth Lead"
];

function generateDiscoveryPrompt(category: string, startSeq: number = 1) {
    const isInfluencer = category === "Digital Influencer";
    
    let strategyMandate = `YOU MUST PERFORM A LIVE SEARCH FOR "${category} for logistics in SOUTH AFRICA" on LinkedIn, Facebook, Instagram, and TikTok.`;
    
    if (isInfluencer) {
        strategyMandate = `ACT AS AN ELITE INDUSTRIAL SCOUT.
        TASK: Discover exactly 30 UNIQUE "Micro-Influencers" BASED IN SOUTH AFRICA within the transport/logistics space.
        
        STRICT REGIONAL LOCK: 
        YOU MUST ONLY RETURN INDIVIDUALS OR HUBS OPERATING WITHIN SOUTH AFRICA. IGNORE ALL INTERNATIONAL RESULTS.
        
        STRICT FOLLOWER CONSTRAINT: 
        TARGET ONLY INDIVIDUALS OR SMALL HUBS WITH UP TO 10,000 FOLLOWERS ON THEIR PRIMARY CHANNEL.
        
        CHANNEL SCAN: 
        Check specifically for presence on Facebook, LinkedIn, Instagram, and TikTok. 
        Focus on creators who talk about South African trucking (e.g., N3/N1 corridors), local supply chains, Durban/Cape Town harbor activity, or courier life in RSA.`;
    }

    return `ACT AS AN ELITE SOUTH AFRICAN INDUSTRIAL RESEARCH AGENT. 
RETURN ONLY A RAW JSON ARRAY. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION.

CRITICAL INTEGRITY SHIELD (ANTI-MOCK POLICY): 
1. ZERO TOLERANCE FOR FICTITIOUS DATA: Do not invent names, emails, or titles to fill fields.
2. NO PATTERN GUESSING: Never construct email addresses (e.g., info@). Only return data found in evidence.
3. NULL MANDATE: If a piece of data (especially the Human Name or Email) is not explicitly visible in the search evidence, you MUST set the field to null.

SOCIAL-FIRST IDENTITY MANDATE:
1. PRIORITIZE SOCIAL PROFILES: Search LinkedIn, Facebook, and Instagram profiles FIRST to identify the actual owner/creator.
2. VERIFIED INDIVIDUALS ONLY: Only provide a "contact_person" if you have found the specific human linked to the brand. 
3. NO BEST-GUESS EDITORS: Do not extract names from general mastheads or staff lists if their specific association with the social channel is unclear.

${strategyMandate}

PROTOCOL:
1. RECORD KEY: Generate a unique "record_id" starting with "DISC_ASSOC_${category.toUpperCase().replace(/\s/g, '_')}_".

REQUIRED JSON FIELDS:
[
  {
    "seq": ${startSeq},
    "record_id": "...",
    "companyName": "CREATIVE HUB / INFLUENCER HANDLE",
    "industrial_category": "${category}",
    "contact_person": "VERIFIED HUMAN NAME (OR NULL)",
    "email": "...",
    "mobile": "...",
    "website": "OFFICIAL CHANNEL/URL",
    "follower_count": "ESTIMATED",
    "primary_channel": "Facebook/LinkedIn/Instagram/TikTok",
    "notes": "..."
  }
]`;
}

const DiscoveryTab = ({ category, currentCount }: { category: string, currentCount: number }) => {
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);
    const [seqOverride, setSeqOverride] = useState<number | ''>('');
    
    const startSeq = useMemo(() => (seqOverride !== '' ? Number(seqOverride) : currentCount + 1), [seqOverride, currentCount]);
    const prompt = generateDiscoveryPrompt(category, startSeq);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(prompt);
        setIsCopied(true);
        toast({ title: "Research Prompt Ready", description: "Social-First identity mandate active." });
        setTimeout(() => setIsCopied(false), 3000);
    };

    return (
        <div className="grid md:grid-cols-2 gap-6 text-left text-foreground">
            <div className="space-y-4 text-left">
                <h2 className="text-2xl font-bold font-headline flex items-center gap-2 text-left">
                    <Share2 className="h-6 w-6 text-primary" />
                    Talent Scouting: {category}
                </h2>

                <Alert className="bg-primary/5 border-primary/20 text-left">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-left font-bold text-foreground">Social-First Identity Active</AlertTitle>
                    <AlertDescription className="text-xs text-left text-muted-foreground">
                        The agent is commanded to prioritize social profiles to identify the actual creator. Hallucinated names are strictly forbidden.
                    </AlertDescription>
                </Alert>

                <div className="p-4 bg-muted/30 border rounded-xl space-y-4 text-left">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 text-left">Sequence Sync</Label>
                    <div className="space-y-1.5 text-left text-foreground">
                        <Label className="text-xs font-bold text-left text-foreground">Start Sequence #</Label>
                        <Input 
                            type="number" 
                            value={seqOverride}
                            onChange={(e) => setSeqOverride(e.target.value === '' ? '' : Number(e.target.value))}
                            className="h-10 font-mono bg-white"
                        />
                    </div>
                </div>
                <Button onClick={handleCopy} size="lg" className="w-full gap-2 h-14 font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-white">
                    {isCopied ? <ClipboardCheck className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    Copy Research Prompt
                </Button>
            </div>
            <div className="space-y-2 text-left text-foreground">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 text-left"><Terminal className="h-3 w-3"/> AI Research Command</Label>
                <ScrollArea className="h-[400px] border rounded-lg bg-slate-900 p-4 text-left">
                    <pre className="text-[10px] text-slate-400 font-mono whitespace-pre-wrap leading-tight text-left">{prompt}</pre>
                </ScrollArea>
            </div>
        </div>
    );
};

export default function AssociateDiscoveryEngine() {
    return (
        <Card className="shadow-none border-none text-left text-foreground">
            <Tabs defaultValue="Digital Influencer" className="w-full text-left">
                <CardHeader className="px-0 pt-0 text-left text-foreground">
                    <CardTitle className="flex items-center gap-2 text-foreground font-black font-headline text-left">
                        <Database className="h-6 w-6 text-primary" />
                        Associate Discovery Engine
                    </CardTitle>
                    <CardDescription className="text-left text-muted-foreground">Identify content and brand creators using noise-suppressed discovery.</CardDescription>
                </CardHeader>
                <CardContent className="px-0 text-left text-foreground">
                    <TabsList className="h-auto flex-wrap justify-start bg-muted/30 p-1 text-left text-foreground">
                        {associateCategories.map(category => (
                            <TabsTrigger key={category} value={category} className="text-xs px-4 py-2">
                                {category}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {associateCategories.map(category => (
                        <TabsContent key={category} value={category} className="mt-8 text-left">
                            <DiscoveryTab category={category} currentCount={0} />
                        </TabsContent>
                    ))}
                </CardContent>
            </Tabs>
        </Card>
    );
}
