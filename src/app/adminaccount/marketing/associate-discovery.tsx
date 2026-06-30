
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
    
    const isPriority = category === 'Industry Influencer';
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
            <div className="space-y-4 text-left text-foreground">
                <div className="flex items-center justify-between text-left">
                    <h2 className="text-2xl font-bold font-headline flex items-center gap-2 text-foreground text-left">
                        <Share2 className="h-6 w-6 text-primary" />
                        Talent Scouting: {category}
                    </h2>
                    {isPriority && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 animate-pulse">
                            <Star className="h-3 w-3 mr-1 fill-current" /> Recommended Focus
                        </Badge>
                    )}
                </div>

                <Alert variant="default" className={cn("text-left", isPriority ? "bg-amber-50 border-amber-200" : "bg-primary/5 border-primary/20")}>
                    {isPriority ? <Star className="h-4 w-4 text-amber-600" /> : <ShieldCheck className="h-4 w-4 text-primary" />}
                    <AlertTitle className={cn("font-bold text-left", isPriority && "text-amber-800")}>
                        {isPriority ? "Trust-Led Growth Strategy" : "Creative Node Search"}
                    </AlertTitle>
                    <AlertDescription className={cn("text-xs text-left", isPriority ? "text-amber-700" : "text-muted-foreground")}>
                        {isPriority 
                            ? "Prioritize these creators to build ecosystem trust. Their established authority is your best tool for rapid market penetration."
                            : "Scouting for creators who can lead the industry's digitalization. Batching optimized for high-impact talent identification."
                        }
                    </AlertDescription>
                </Alert>

                <div className="p-4 bg-muted/30 border rounded-xl space-y-4 text-left">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 text-left">Sequence Sync</Label>
                    <div className="space-y-1.5 text-left text-foreground">
                        <Label className="text-xs font-bold text-foreground text-left">Start Sequence #</Label>
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
            <div className="space-y-2 text-left text-foreground">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 text-left"><Terminal className="h-3 w-3"/> Command Preview</Label>
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
            <Tabs defaultValue="Industry Influencer" className="w-full text-left">
                <CardHeader className="px-0 pt-0 text-left text-foreground">
                    <CardTitle className="flex items-center gap-2 text-foreground font-black font-headline text-left">
                        <Database className="h-6 w-6 text-primary" />
                        Associate Discovery Engine
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-left text-foreground">Identify high-impact content and brand creators for recruitment.</CardDescription>
                </CardHeader>
                <CardContent className="px-0 text-left text-foreground">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 text-left text-foreground">
                        <div className="lg:col-span-2 text-left text-foreground">
                            <TabsList className="h-auto flex-wrap justify-start bg-muted/30 p-1 text-left text-foreground">
                                {associateCategories.map(category => (
                                    <TabsTrigger key={category} value={category} className="text-xs px-4 py-2">
                                        {category}
                                        {category === 'Industry Influencer' && <Star className="h-3 w-3 ml-2 text-amber-500 fill-current" />}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            <div className="mt-8 text-left text-foreground">
                                {associateCategories.map(category => (
                                    <TabsContent key={category} value={category} className="mt-0 text-left text-foreground text-foreground">
                                        <DiscoveryTab category={category} currentCount={0} />
                                    </TabsContent>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6 text-left text-foreground">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 text-left">
                                <Info className="h-4 w-4" /> 
                                Tactical Roadmap
                            </h3>
                            <Card className="bg-slate-50 border-none shadow-sm text-left text-foreground">
                                <CardContent className="p-4 space-y-4 text-[11px] leading-relaxed text-muted-foreground text-left">
                                    <div className="space-y-1 text-left">
                                        <p className="font-black text-foreground flex items-center gap-1.5 uppercase tracking-tighter text-left">
                                            <UserCheck className="h-3 w-3 text-amber-500 fill-current"/> Phase 1: Industry Influencer
                                        </p>
                                        <p className="font-bold text-amber-700 italic text-left">Recommended Primary Focus.</p>
                                        <p className="text-left">Thought leaders with an established "ear" in the SA trucking sector.</p>
                                    </div>
                                    <Separator />
                                    <div className="space-y-1 text-left">
                                        <p className="font-black text-foreground flex items-center gap-1.5 uppercase tracking-tighter text-left">
                                            <Video className="h-3 w-3 text-primary"/> Phase 2: Content Creator
                                        </p>
                                        <p className="text-left text-foreground">High-volume media producers who create industrial narratives.</p>
                                    </div>
                                    <Separator />
                                    <div className="space-y-1 text-left">
                                        <p className="font-black text-foreground flex items-center gap-1.5 uppercase tracking-tighter text-left text-foreground">
                                            <Zap className="h-3 w-3 text-primary"/> Phase 3: Digital Marketer
                                        </p>
                                        <p className="text-left text-foreground">Professionals who turn social content into registered members.</p>
                                    </div>
                                    <Separator />
                                    <div className="space-y-1 text-left">
                                        <p className="font-black text-foreground flex items-center gap-1.5 uppercase tracking-tighter text-left text-foreground">
                                            <Palette className="h-3 w-3 text-primary"/> Phase 4: Brand Strategist
                                        </p>
                                        <p className="text-left text-muted-foreground text-foreground">Ensuring transporters look professional and "lender-ready".</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Alert variant="default" className="border-blue-200 bg-blue-50/30 text-left text-foreground">
                                <Info className="h-4 w-4 text-blue-600" />
                                <AlertDescription className="text-[10px] text-blue-800 leading-tight text-left text-foreground">
                                    <strong>Tip:</strong> Start with influencers to gain mass-credibility, then use creators to fill the <strong>Marketing Library</strong> with assets.
                                </AlertDescription>
                            </Alert>
                        </div>
                    </div>
                </CardContent>
            </Tabs>
        </Card>
    );
}
