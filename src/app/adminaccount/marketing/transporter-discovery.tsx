'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Copy, ClipboardCheck, Info, Search, Terminal, RefreshCcw, Database, Loader2, Zap, Globe, ShieldCheck, SearchCode } from "lucide-react";
import { useState, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const transporterCategories = [
    "Long Haul", "Refrigerated", "Flatbed", "Tipper", "Hazmat", "LTL", "Cross-Border", "Local Distribution", "Container Transport", "Abnormal Loads"
];

function generateDiscoveryPrompt(category: string, startPage: number) {
    const startSeq = (startPage - 1) * 30 + 1;

    return `ACT AS AN ELITE SOUTH AFRICAN INDUSTRIAL RESEARCH AGENT (V11 - FLAT-SITE RESILIENT).
RETURN ONLY A RAW JSON ARRAY. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION.

STRICT REGIONAL LOCK: ONLY return entities based in SOUTH AFRICA. IGNORE all international results.

TASK: Discover and extract exactly 30 UNIQUE, LIVE South African transport companies for: "${category}".

HUNT PROTOCOL (FLAT-SITE AWARE):
1. BROAD DISCOVERY: Identify official domains and local directory listings. Try acronym variants (e.g., if you see "JH", find "Junior H").
2. FLAT-SITE ANALYSIS: Many industrial sites are one-page. Analyze root snippets for "Contact Cards" or sectional data (Address, Email, Phone) if sub-pages like /contact are missing.
3. TEAM DISCOVERY: Search for "site:[OFFICIAL_DOMAIN] management" or "site:[OFFICIAL_DOMAIN] team" to find ACTUAL NAMES of the CEO/MD and Marketing Lead.
4. IDENTITY RESOLUTION: Perform targeted secondary searches on LinkedIn and Facebook for identified names to resolve direct professional email and mobile numbers.

CRITICAL INTEGRITY SHIELD: 
- REAL DATA ONLY: Do not invent names or guess email patterns.
- NULL MANDATE: If data is not explicitly visible in search evidence after these multi-query checks, return null for that field.

RECORD KEY: Generate a unique "record_id" starting with "DISC_TRANS_${category.toUpperCase().replace(/\s/g, '_')}_".

REQUIRED JSON FIELDS:
[
  {
    "seq": ${startSeq},
    "record_id": "...",
    "companyName": "FULL LEGAL NAME",
    "industrial_category": "${category}",
    "website": "OFFICIAL VERIFIED URL",
    "email": "VERIFIED GENERAL EMAIL",
    "phone": "RSA LANDLINE",
    "address": "FULL PHYSICAL ADDRESS IN RSA",
    "marketingManager": { "name": "...", "email": "...", "mobile": "..." },
    "ceo": { "name": "...", "email": "...", "mobile": "..." },
    "minedServiceWording": "TECHNICAL SUMMARY MINED FROM SITE SECTIONS (300 WORDS)"
  }
]`;
}

const DiscoveryTab = ({ category, currentCount }: { category: string, currentCount: number }) => {
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);
    const [pageOverride, setPageOverride] = useState<number | ''>('');
    
    const suggestedPage = Math.floor(currentCount / 30) + 1;
    const startPage = pageOverride !== '' ? Number(pageOverride) : suggestedPage;
    const prompt = useMemo(() => generateDiscoveryPrompt(category, startPage), [category, startPage]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(prompt);
        setIsCopied(true);
        toast({ title: "V11 Scavenger Ready", description: "Flat-site and multi-query identity resolution active." });
        setTimeout(() => setIsCopied(false), 3000);
    };

    return (
        <div className="grid md:grid-cols-2 gap-6 text-left text-foreground">
            <div className="space-y-4 text-left">
                <h2 className="text-2xl font-bold font-headline flex items-center gap-2 text-left">
                    <SearchCode className="h-6 w-6 text-primary" />
                    Haulier Mapping: {category}
                </h2>
                <Alert className="bg-primary/5 border-primary/20 text-left">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-left font-bold">Hunt Protocol V11 Active</AlertTitle>
                    <AlertDescription className="text-xs text-left leading-relaxed">
                        Optimized for single-page industrial sites (e.g., Junior H Trucking). Forces sectional block analysis and acronym expansion to bridge data gaps.
                    </AlertDescription>
                </Alert>
                <div className="p-4 bg-muted/30 border rounded-xl space-y-4 text-left">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Pagination Sync</Label>
                    <div className="space-y-1.5 text-left">
                        <Label className="text-xs font-bold text-left">Start from Batch #</Label>
                        <Input 
                            type="number" 
                            placeholder={String(suggestedPage)}
                            value={pageOverride}
                            onChange={(e) => setPageOverride(e.target.value === '' ? '' : Number(e.target.value))}
                            className="h-10 font-mono bg-white"
                        />
                    </div>
                </div>
                <Button onClick={handleCopy} size="lg" className="w-full gap-2 h-14 font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-white">
                    {isCopied ? <ClipboardCheck className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    Copy V11 Haulier Prompt
                </Button>
            </div>
            <div className="space-y-2 text-left">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 text-left"><Terminal className="h-3 w-3"/> Industrial Command (V11)</Label>
                <ScrollArea className="h-[400px] border rounded-lg bg-slate-900 p-4 shadow-inner text-left">
                    <pre className="text-[10px] text-slate-400 font-mono whitespace-pre-wrap leading-tight text-left">{prompt}</pre>
                </ScrollArea>
            </div>
        </div>
    );
};

export default function TransporterDiscoveryEngine() {
    return (
        <Card className="shadow-none border-none text-left">
            <Tabs defaultValue="Long Haul" className="w-full text-left">
                <CardHeader className="px-0 pt-0 text-left">
                    <CardTitle className="flex items-center gap-2 text-left font-black font-headline text-foreground">
                        <Database className="h-6 w-6 text-primary" />
                        Industrial Haulier Scavenger
                    </CardTitle>
                    <CardDescription className="text-left text-muted-foreground">Map unique transport entities using the V11 flat-site resilient scavenger protocol.</CardDescription>
                </CardHeader>
                <CardContent className="px-0 text-left">
                    <TabsList className="h-auto flex-wrap justify-start bg-muted/30 mb-8 p-1 text-left">
                        {transporterCategories.map(category => (
                            <TabsTrigger key={category} value={category} className="text-xs px-4 py-2">{category}</TabsTrigger>
                        ))}
                    </TabsList>
                    {transporterCategories.map(category => (
                        <TabsContent key={category} value={category} className="mt-0 text-left">
                            <DiscoveryTab category={category} currentCount={0} />
                        </TabsContent>
                    ))}
                </CardContent>
            </Tabs>
        </Card>
    );
}
