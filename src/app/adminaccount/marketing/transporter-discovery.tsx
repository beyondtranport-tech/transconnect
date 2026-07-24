
'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Copy, ClipboardCheck, Info, Search, Terminal, RefreshCcw, Database, Loader2, Zap, Globe, ShieldCheck } from "lucide-react";
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

    return `ACT AS AN ELITE SOUTH AFRICAN INDUSTRIAL RESEARCH AGENT.
RETURN ONLY A RAW JSON ARRAY. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION.

NOISE SUPPRESSION PROTOCOL:
1. IGNORE ALL JOB LISTINGS, POLICY NEWS, AND NEWS ARTICLES.
2. FOCUS ONLY ON LIVE CORPORATE LANDING PAGES AND BUSINESS DIRECTORIES.

CRITICAL INTEGRITY SHIELD (ANTI-BOUNCE): 
1. REAL DATA ONLY: DO NOT RETURN MOCK OR HALLUCINATED DATA.
2. NO GUESSING: NEVER construct or "guess" email addresses based on patterns (e.g., info@company.co.za). 
3. VERIFICATION MANDATE: Only return an email if it is explicitly listed in search evidence. If not found, return null.

TASK: Discover and extract exactly 30 UNIQUE live transport companies in SOUTH AFRICA for: "${category}".

STRICT PROTOCOL:
1. DATA MINING: Find the OFFICIAL CORPORATE WEBSITE. Verify existence.
2. TECHNICAL FOCUS: In the "notes" field, provide a 2-sentence summary of SPECIFIC fleet capabilities.
3. IDENTITY: Find the ACTUAL NAME (First and Last) of the Managing Director, Owner, or CEO.
4. RECORD KEY: Generate a unique "record_id" starting with "DISC_TRANS_${category.toUpperCase().replace(/\s/g, '_')}_".

REQUIRED OUTPUT FORMAT (RAW JSON ARRAY ONLY):
[
  {
    "seq": ${startSeq},
    "record_id": "...",
    "companyName": "FULL LEGAL NAME",
    "industrial_category": "${category}",
    "contactPerson": "VERIFIED HUMAN NAME",
    "email": "Professional Email",
    "phone": "...",
    "website": "OFFICIAL VERIFIED URL",
    "address": "FULL Street, Suburb, City, Province",
    "notes": "TECHNICAL SUMMARY"
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
        toast({ title: "Research Prompt Ready", description: "Anti-guessing and bounce-prevention protocol active." });
        setTimeout(() => setIsCopied(false), 3000);
    };

    return (
        <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="space-y-4 text-left text-foreground">
                <h2 className="text-2xl font-bold font-headline flex items-center gap-2 text-left">
                    <Search className="h-6 w-6 text-primary" />
                    Haulier Mapping: {category}
                </h2>
                <Alert className="bg-primary/5 border-primary/20 text-left">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-left font-bold text-foreground">Integrity Shield Active</AlertTitle>
                    <AlertDescription className="text-xs text-left text-foreground">
                        Guessed or construction emails are prohibited. Registry records will prioritize accuracy over volume.
                    </AlertDescription>
                </Alert>
                <div className="p-4 bg-muted/30 border rounded-xl space-y-4 text-left">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary text-left">Pagination Sync</Label>
                    <div className="space-y-1.5 text-left text-foreground">
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
                    Copy Research Prompt
                </Button>
            </div>
            <div className="space-y-2 text-left text-foreground">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 text-left"><Terminal className="h-3 w-3"/> Industrial Command</Label>
                <ScrollArea className="h-[400px] border rounded-lg bg-slate-900 p-4 shadow-inner text-left">
                    <pre className="text-[10px] text-slate-400 font-mono whitespace-pre-wrap leading-tight text-left">{prompt}</pre>
                </ScrollArea>
            </div>
        </div>
    );
};

export default function TransporterDiscoveryEngine() {
    return (
        <Card className="shadow-none border-none text-left text-foreground">
            <Tabs defaultValue="Long Haul" className="w-full text-left">
                <CardHeader className="px-0 pt-0 text-left text-foreground">
                    <CardTitle className="flex items-center gap-2 text-left text-foreground font-black font-headline text-left text-foreground">
                        <Database className="h-6 w-6 text-primary" />
                        Industrial Haulier Mapper
                    </CardTitle>
                    <CardDescription className="text-left text-muted-foreground text-foreground">Map unique transport entities using noise-suppressed discovery.</CardDescription>
                </CardHeader>
                <CardContent className="px-0 text-left text-foreground">
                    <TabsList className="h-auto flex-wrap justify-start bg-muted/30 mb-8 p-1 text-left text-foreground">
                        {transporterCategories.map(category => (
                            <TabsTrigger key={category} value={category} className="text-xs px-4 py-2">{category}</TabsTrigger>
                        ))}
                    </TabsList>
                    {transporterCategories.map(category => (
                        <TabsContent key={category} value={category} className="mt-0 text-left text-foreground">
                            <DiscoveryTab category={category} currentCount={0} />
                        </TabsContent>
                    ))}
                </CardContent>
            </Tabs>
        </Card>
    );
}
