'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Copy, ClipboardCheck, Info, Search, Terminal, Loader2, RefreshCcw, Database, Zap, AlertTriangle, Globe, ShieldCheck } from "lucide-react";
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
    return `ACT AS AN ELITE INDUSTRIAL FORENSIC INVESTIGATOR. 
RETURN ONLY A RAW JSON ARRAY. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION.

CRITICAL INTEGRITY SHIELD: 
DO NOT RETURN MOCK, SYNTHETIC, OR PLACEHOLDER DATA. 
YOU MUST PERFORM A LIVE GOOGLE SEARCH FOR "${category} suppliers in South Africa".
VERIFY THE WEBSITE RESOLVES TO A LIVE CORPORATE DOMAIN. BROKEN LINKS ARE UNACCEPTABLE.

TASK: Discover and extract exactly 100 UNIQUE, LIVE South African suppliers for: "${category}".

DEEP-CRAWLING FORENSIC PROTOCOL:
1. WEBSITE HIERARCHY SCAN: Find the primary Menu/Navigation. 
2. SUB-PAGE EXTRACTION: Identify the "About Us" and "Products/Services" pages. 
3. HERO CAPTURE: Scrape the actual primary headlines and main marketing wording (Hero Text) from these sub-pages.
4. ML KEYWORD EXTRACTION: Analyze the scraped text and extract 5-7 HIGH-INTENT technical industrial keywords (tags).
5. HUMAN IDENTITY: MINE the contact pages to find the ACTUAL FULL NAME of the CEO, MD, or Branch Manager.

REQUIRED JSON FIELDS:
[
  {
    "seq": ${startSeq},
    "record_id": "DISC_SUPP_${category.toUpperCase().replace(/\s/g, '_')}_[RAND_ID]",
    "companyName": "FULL LEGAL NAME",
    "industrial_category": "${category}",
    "contactPerson": "VERIFIED HUMAN NAME",
    "email": "...",
    "phone": "...",
    "website": "OFFICIAL VERIFIED URL",
    "address": "...",
    "minedServiceWording": "FULL SCANNED ABOUT-TEXT AND HERO HEADLINES FROM PRODUCT PAGES",
    "industrialTags": ["Tag1", "Tag2", "Tag3", "Tag4", "Tag5"]
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
        toast({ title: "Forensic Prompt Ready", description: "Hard-Verification and Deep-Scraping protocols active." });
        setTimeout(() => setIsCopied(false), 3000);
    };

    return (
        <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="space-y-4 text-left">
                <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
                    <Globe className="h-6 w-6 text-primary" />
                    Forensic Discovery: {category}
                </h2>
                <Alert className="bg-primary/5 border-primary/20 text-left">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-left font-bold">Deep-Scraping Active</AlertTitle>
                    <AlertDescription className="text-xs text-left">
                        This prompt commands the AI to perform live corporate audits, visit sub-menus, and extract product-page hero text and ML tags.
                    </AlertDescription>
                </Alert>
                <div className="p-4 bg-muted/30 border rounded-xl space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sequence Sync</Label>
                    <div className="space-y-1.5 text-left">
                        <Label className="text-xs font-bold">Start Sequence #</Label>
                        <Input 
                            type="number" 
                            value={seqOverride}
                            onChange={(e) => setSeqOverride(e.target.value === '' ? '' : Number(e.target.value))}
                            className="h-10 font-mono bg-white"
                        />
                    </div>
                </div>
                <Button onClick={handleCopy} size="lg" className="w-full gap-2 h-14 font-black uppercase tracking-widest">
                    {isCopied ? <ClipboardCheck className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    Copy Deep-Forensic Prompt
                </Button>
            </div>
            <div className="space-y-2 text-left">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Terminal className="h-3 w-3"/> Command Preview</Label>
                <ScrollArea className="h-[400px] border rounded-lg bg-slate-900 p-4">
                    <pre className="text-[10px] text-slate-400 font-mono whitespace-pre-wrap leading-tight">{prompt}</pre>
                </ScrollArea>
            </div>
        </div>
    );
};

export default function DiscoveryEngine() {
    return (
        <Card className="shadow-none border-none text-left">
            <Tabs defaultValue="Accessories" className="w-full text-left">
                <CardHeader className="px-0 pt-0 text-left">
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-6 w-6 text-primary" />
                        AI Forensic Discovery (Deep Scan)
                    </CardTitle>
                    <CardDescription>Use the Deep-Scraping prompt to build a high-fidelity technical registry.</CardDescription>
                </CardHeader>
                <CardContent className="px-0 text-left">
                    <TabsList className="h-auto flex-wrap justify-start bg-muted/30 mb-8 p-1">
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