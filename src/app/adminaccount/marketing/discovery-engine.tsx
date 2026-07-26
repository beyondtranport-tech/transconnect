'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Copy, ClipboardCheck, Info, Search, Terminal, Loader2, RefreshCcw, Database, Zap, AlertTriangle, Globe, ShieldCheck, SearchCode } from "lucide-react";
import * as React from "react";
import { useState, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const supplierCategories = [
    "Accessories", "Air", "Anti-Theft Devices", "Auto Electrical", "Batteries", 
    "Brakes", "Cleaning Products", "Diesel", "Differential", "Engine Refurbish",
    "Filters", "Injectors", "Lights", "Mechanical repairs", "Oils & Lubricants", 
    "Parts", "Prop Shafts", "Second Hand Trailers", "Second Hand Trucks", "Transport", 
    "Tarpaulins", "Tow in", "Trailer repairs", "Truck Accessories", "Truck Parts", 
    "Truck repairs", "Turbo", "Tyres"
];

function generateDiscoveryPrompt(category: string, startSeq: number = 1) {
    return `ACT AS AN ELITE SOUTH AFRICAN INDUSTRIAL RESEARCH AGENT (V7 - FORENSIC HUNT). 
RETURN ONLY A RAW JSON ARRAY. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION.

STRICT REGIONAL LOCK: ONLY return entities based in SOUTH AFRICA. IGNORE all international results.

TASK: Discover and extract exactly 30 UNIQUE, LIVE South African suppliers for: "${category}".

HUNT PROTOCOL:
1. WEBSITE & SITEMAP: Identify the official website. You MUST crawl the Sitemap, 'About Us', 'Meet the Team', and 'Contact' sub-pages to identify the names of the CEO, MD, and Marketing Manager.
2. IDENTITY RESOLUTION: Use identified names to perform a targeted SECONDARY search on LinkedIn and Facebook for that specific individual to resolve their direct professional email and direct mobile numbers (+27 format).
3. AGGREGATOR CROSS-REFERENCE: Use local SA directories (Brabys, Yellosa, Infoisinfo) to bridge contact gaps for landlines.
4. BROAD SEARCHING: Do not use restrictive quotes. Search for variants like "JH Trucking" and "Jh Trucking South Africa" to find the domain.

CRITICAL INTEGRITY SHIELD: 
- REAL DATA ONLY: Do not invent names or guess email patterns.
- NULL MANDATE: If data is not explicitly visible in search evidence after deep sitemap and secondary checks, set the field to null.

REQUIRED JSON FIELDS:
[
  {
    "seq": ${startSeq},
    "record_id": "DISC_SUPP_${category.toUpperCase().replace(/\s/g, '_')}_[RAND_ID]",
    "companyName": "FULL LEGAL NAME",
    "industrial_category": "${category}",
    "contactPerson": "VERIFIED HUMAN NAME",
    "email": "VERIFIED GENERAL EMAIL",
    "phone": "RSA LANDLINE",
    "website": "OFFICIAL VERIFIED URL",
    "address": "...",
    "marketingManager": { "name": "...", "email": "...", "mobile": "..." },
    "ceo": { "name": "...", "email": "...", "mobile": "..." },
    "minedServiceWording": "TECHNICAL SUMMARY MINED FROM SITE SUB-PAGES (300 WORDS)",
    "industrialTags": ["Tag1", "Tag2", "Tag3"]
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
        toast({ title: "V7 Command Ready", description: "Broad search and sitemap protocol active." });
        setTimeout(() => setIsCopied(false), 3000);
    };

    return (
        <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="space-y-4 text-left text-foreground">
                <h2 className="text-2xl font-bold font-headline flex items-center gap-2 text-left">
                    <SearchCode className="h-6 w-6 text-primary" />
                    Forensic Sourcing: {category}
                </h2>
                <Alert className="bg-primary/5 border-primary/20 text-left">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-left font-bold text-foreground text-left">Hunt Protocol V7 Active</AlertTitle>
                    <AlertDescription className="text-xs text-left text-muted-foreground text-foreground leading-relaxed">
                        Commands the agent to crawl sitemaps for employee lists and pivot to social platforms for direct contact resolution. Search logic is broadened to ensure domain discovery.
                    </AlertDescription>
                </Alert>
                <div className="p-4 bg-muted/30 border rounded-xl space-y-4 text-left">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Sequence Sync</Label>
                    <div className="space-y-1.5 text-left">
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
                    Copy V7 Discovery Prompt
                </Button>
            </div>
            <div className="space-y-2 text-left text-foreground text-foreground">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 text-left text-foreground"><Terminal className="h-3 w-3"/> Command Preview (V7)</Label>
                <ScrollArea className="h-[400px] border rounded-lg bg-slate-900 p-4 text-left text-foreground">
                    <pre className="text-[10px] text-slate-400 font-mono whitespace-pre-wrap leading-tight text-left">{prompt}</pre>
                </ScrollArea>
            </div>
        </div>
    );
};

export default function DiscoveryEngine() {
    return (
        <Card className="shadow-none border-none text-left text-foreground">
            <Tabs defaultValue="Accessories" className="w-full text-left">
                <CardHeader className="px-0 pt-0 text-left">
                    <CardTitle className="flex items-center gap-2 text-left text-foreground font-black font-headline">
                        <Database className="h-6 w-6 text-primary" />
                        Industrial Discovery Hub
                    </CardTitle>
                    <CardDescription className="text-left text-muted-foreground">Build a high-fidelity registry using the broadened V7 scavenger protocol.</CardDescription>
                </CardHeader>
                <CardContent className="px-0 text-left">
                    <TabsList className="h-auto flex-wrap justify-start bg-muted/30 mb-8 p-1 text-left">
                        {supplierCategories.map(category => (
                            <TabsTrigger key={category} value={category} className="text-xs px-4 py-2">{category}</TabsTrigger>
                        ))}
                    </TabsList>
                    {supplierCategories.map(category => (
                        <TabsContent key={category} value={category} className="text-left">
                            <DiscoveryTab category={category} currentCount={0} />
                        </TabsContent>
                    ))}
                </CardContent>
            </Tabs>
        </Card>
    );
}
