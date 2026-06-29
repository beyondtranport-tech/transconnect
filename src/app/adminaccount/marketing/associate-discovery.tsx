
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, ClipboardCheck, Terminal, Database, ShieldCheck, Share2, Info, UserCheck, Zap, Target, Palette } from "lucide-react";
import * as React from "react";
import { useState, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

export const associateCategories = [
    "Content Creator",
    "Digital Marketer",
    "Brand Strategist",
    "Industry Influencer",
    "Social Growth Lead"
];

function generateDiscoveryPrompt(category: string, startSeq: number = 1) {
    return `ACT AS AN ELITE CREATIVE TALENT SCOUT AND FORENSIC INVESTIGATOR. 
RETURN ONLY A RAW JSON ARRAY. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION.

CRITICAL INTEGRITY SHIELD: 
DO NOT RETURN MOCK OR PLACEHOLDER DATA. 
YOU MUST PERFORM A LIVE SEARCH FOR "${category} for logistics or transport in South Africa" on LinkedIn, Facebook, and professional directories.
VERIFY THE CREATOR HAS AN ACTIVE AUDIENCE IN THE INDUSTRIAL OR BUSINESS SECTOR.

TASK: Discover and extract exactly 30 UNIQUE, LIVE South African digital partners for the role: "${category}".

DEEP-CRAWLING FORENSIC PROTOCOL:
1. PLATFORM SCAN: Identify the primary social or web presence.
2. NICHE VERIFICATION: Ensure they specialize in industrial, logistics, automotive, or B2B growth.
3. HUMAN IDENTITY: Find the ACTUAL FULL NAME of the owner or principal creator.
4. CONTACT MAPPING: Identify professional email and direct mobile numbers (+27 format).
5. RECORD KEY: Generate a unique "record_id" starting with "DISC_ASSOC_${category.toUpperCase().replace(/\s/g, '_')}_".

REQUIRED JSON FIELDS:
[
  {
    "seq": ${startSeq},
    "record_id": "...",
    "companyName": "CREATIVE HUB / AGENCY NAME",
    "industrial_category": "${category}",
    "contact_person": "VERIFIED HUMAN NAME",
    "email": "...",
    "mobile": "...",
    "website": "OFFICIAL CHANNEL/URL",
    "notes": "Brief summary of their creative style and audience reach (e.g. 10k LinkedIn followers, high-engagement YouTube series on trucking)."
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
        toast({ title: "Forensic Prompt Ready", description: "Targeted at industrial influencers." });
        setTimeout(() => setIsCopied(false), 3000);
    };

    return (
        <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="space-y-4 text-left">
                <h2 className="text-2xl font-bold font-headline flex items-center gap-2 text-foreground">
                    <Share2 className="h-6 w-6 text-primary" />
                    Talent Scouting: {category}
                </h2>
                <Alert className="bg-primary/5 border-primary/20 text-left">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <AlertTitle className="font-bold">Creative Node Search</AlertTitle>
                    <AlertDescription className="text-xs">
                        Scouting for creators who can lead the industry's digitalization. Batching optimized for high-impact talent identification.
                    </AlertDescription>
                </Alert>
                <div className="p-4 bg-muted/30 border rounded-xl space-y-4 text-left">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Sequence Sync</Label>
                    <div className="space-y-1.5 text-left text-foreground">
                        <Label className="text-xs font-bold text-foreground">Start Sequence #</Label>
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
                    Copy Scouting Prompt
                </Button>
            </div>
            <div className="space-y-2 text-left">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 text-left text-foreground"><Terminal className="h-3 w-3"/> Command Preview</Label>
                <ScrollArea className="h-[400px] border rounded-lg bg-slate-900 p-4">
                    <pre className="text-[10px] text-slate-400 font-mono whitespace-pre-wrap leading-tight">{prompt}</pre>
                </ScrollArea>
            </div>
        </div>
    );
};

export default function AssociateDiscoveryEngine() {
    return (
        <Card className="shadow-none border-none text-left text-foreground">
            <Tabs defaultValue="Content Creator" className="w-full text-left">
                <CardHeader className="px-0 pt-0 text-left text-foreground">
                    <CardTitle className="flex items-center gap-2 text-foreground font-black font-headline">
                        <Database className="h-6 w-6 text-primary" />
                        Associate Discovery Engine
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">Identify high-impact content and brand creators for recruitment.</CardDescription>
                </CardHeader>
                <CardContent className="px-0 text-left text-foreground">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                        <div className="lg:col-span-2">
                            <TabsList className="h-auto flex-wrap justify-start bg-muted/30 p-1">
                                {associateCategories.map(category => (
                                    <TabsTrigger key={category} value={category} className="text-xs px-4 py-2">{category}</TabsTrigger>
                                ))}
                            </TabsList>
                            <div className="mt-8">
                                {associateCategories.map(category => (
                                    <TabsContent key={category} value={category} className="mt-0">
                                        <DiscoveryTab category={category} currentCount={0} />
                                    </TabsContent>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                <Info className="h-4 w-4" /> 
                                Industrial Category Guide
                            </h3>
                            <Card className="bg-slate-50 border-none shadow-sm">
                                <CardContent className="p-4 space-y-4 text-[11px] leading-relaxed text-muted-foreground">
                                    <div className="space-y-1">
                                        <p className="font-black text-foreground flex items-center gap-1.5 uppercase tracking-tighter">
                                            <Video className="h-3 w-3 text-primary"/> Content Creator
                                        </p>
                                        <p>Focused on **Production**. High-volume media producers who create industrial narratives (YouTube/Blogs) using the AI Studio.</p>
                                    </div>
                                    <Separator />
                                    <div className="space-y-1">
                                        <p className="font-black text-foreground flex items-center gap-1.5 uppercase tracking-tighter">
                                            <Zap className="h-3 w-3 text-primary"/> Digital Marketer
                                        </p>
                                        <p>Focused on **Conversion**. Professionals who turn social content into registered members and transactional flow.</p>
                                    </div>
                                    <Separator />
                                    <div className="space-y-1">
                                        <p className="font-black text-foreground flex items-center gap-1.5 uppercase tracking-tighter">
                                            <Palette className="h-3 w-3 text-primary"/> Brand Strategist
                                        </p>
                                        <p>Focused on **Identity**. They ensure transporters look professional and "lender-ready" on the platform.</p>
                                    </div>
                                    <Separator />
                                    <div className="space-y-1">
                                        <p className="font-black text-foreground flex items-center gap-1.5 uppercase tracking-tighter">
                                            <UserCheck className="h-3 w-3 text-primary"/> Industry Influencer
                                        </p>
                                        <p>Focused on **Trust**. Thought leaders with an established "ear" in the SA trucking sector. Act as authoritative ambassadors.</p>
                                    </div>
                                    <Separator />
                                    <div className="space-y-1">
                                        <p className="font-black text-foreground flex items-center gap-1.5 uppercase tracking-tighter">
                                            <Target className="h-3 w-3 text-primary"/> Social Growth Lead
                                        </p>
                                        <p>Focused on **Scale**. Specialists who use viral network-effect tactics to rapidly expand your digital partner nodes.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </CardContent>
            </Tabs>
        </Card>
    );
}
