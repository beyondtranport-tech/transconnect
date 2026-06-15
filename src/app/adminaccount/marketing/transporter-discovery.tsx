'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Copy, ClipboardCheck, Info, Search, Terminal, RefreshCcw, Database, Loader2, Zap, Globe, ShieldCheck } from "lucide-react";
import * as React from "react";
import { useState, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getClientSideAuthToken } from '@/firebase';
import { useConfig } from '@/hooks/use-config';
import { Input } from "@/components/ui/input";

export const transporterCategories = [
    "Long Haul", "Refrigerated", "Flatbed", "Tipper", "Hazmat", "LTL", "Cross-Border", "Local Distribution", "Container Transport", "Abnormal Loads"
];

function generateDiscoveryPrompt(category: string, startPage: number) {
    const startSeq = (startPage - 1) * 100 + 1;

    return `ACT AS AN ELITE INDUSTRIAL FORENSIC INVESTIGATOR.
RETURN ONLY A RAW JSON ARRAY. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION.

CRITICAL INTEGRITY SHIELD: 
DO NOT RETURN MOCK OR PLACEHOLDER DATA. 
YOU MUST PERFORM A LIVE GOOGLE SEARCH FOR "${category} transport companies South Africa".
VERIFY THE WEBSITE RESOLVES TO A LIVE CORPORATE DOMAIN. BROKEN LINKS ARE UNACCEPTABLE.

TASK: Discover and extract exactly 100 UNIQUE live transport companies in SOUTH AFRICA for: "${category}".

STRICT FORENSIC PROTOCOL:
1. DATA MINING: Find the OFFICIAL CORPORATE WEBSITE. Verify existence.
2. TECHNICAL FOCUS: In the "notes" field, provide a 2-sentence summary of SPECIFIC fleet capabilities (e.g. 34t Side-Tippers, SADC corridors, reefer temperature zones).
3. FORBIDDEN WORDS: innovative, leading, spearheading, solutions, backbone, ecosystem.
4. IDENTITY: Find the ACTUAL NAME (First and Last) of the Managing Director, Owner, or CEO via LinkedIn or Contact pages.
5. RECORD KEY: Generate a unique "record_id" starting with "DISC_TRANS_${category.toUpperCase().replace(/\s/g, '_')}_".

REQUIRED OUTPUT FORMAT (RAW JSON ARRAY ONLY):
[
  {
    "seq": ${startSeq},
    "record_id": "...",
    "company_name": "FULL LEGAL NAME",
    "industrial_category": "${category}",
    "contact_person": "VERIFIED HUMAN NAME",
    "email_address": "Professional Email",
    "telephone_number": "...",
    "website": "OFFICIAL VERIFIED URL",
    "physical_address": "FULL Street, Suburb, City, Province",
    "notes": "TECHNICAL SUMMARY"
  }
]`;
}

const DiscoveryTab = ({ category, currentCount }: { category: string, currentCount: number }) => {
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);
    const [pageOverride, setPageOverride] = useState<number | ''>('');
    
    const suggestedPage = Math.floor(currentCount / 100) + 1;
    const startPage = pageOverride !== '' ? Number(pageOverride) : suggestedPage;
    const prompt = useMemo(() => generateDiscoveryPrompt(category, startPage), [category, startPage]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(prompt);
        setIsCopied(true);
        toast({ title: "Forensic Prompt Ready" });
        setTimeout(() => setIsCopied(false), 3000);
    };

    return (
        <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="space-y-4">
                <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
                    <Search className="h-6 w-6 text-primary" />
                    Haulier Discovery: {category}
                </h2>
                <Alert className="bg-primary/5 border-primary/20">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <AlertTitle>Hard-Verification Active</AlertTitle>
                    <AlertDescription className="text-xs">
                        Commanding AI to perform live audits. Mock data and non-resolving websites are strictly forbidden.
                    </AlertDescription>
                </Alert>
                <div className="p-4 bg-muted/30 border rounded-xl space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Pagination Sync</Label>
                    <div className="space-y-1.5 text-left">
                        <Label className="text-xs font-bold">Start from Page #</Label>
                        <Input 
                            type="number" 
                            placeholder={String(suggestedPage)}
                            value={pageOverride}
                            onChange={(e) => setPageOverride(e.target.value === '' ? '' : Number(e.target.value))}
                            className="h-10 font-mono bg-white"
                        />
                    </div>
                </div>
                <Button onClick={handleCopy} size="lg" className="w-full gap-2 h-14 font-black uppercase tracking-widest bg-primary hover:bg-primary/90">
                    {isCopied ? <ClipboardCheck className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    Copy Forensic Prompt
                </Button>
            </div>
            <div className="space-y-2 text-left">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Terminal className="h-3 w-3"/> Industrial Command
                </Label>
                <ScrollArea className="h-[400px] border rounded-lg bg-slate-900 p-4 shadow-inner">
                    <pre className="text-[10px] text-slate-400 font-mono whitespace-pre-wrap leading-tight">{prompt}</pre>
                </ScrollArea>
            </div>
        </div>
    );
};

export default function TransporterDiscoveryEngine() {
    return (
        <Card className="shadow-none border-none">
            <Tabs defaultValue="Long Haul" className="w-full">
                <CardHeader className="px-0 pt-0 text-left">
                    <CardTitle className="flex items-center gap-2 text-left">
                        <Database className="h-6 w-6 text-primary" />
                        Forensic Haulier Mapper
                    </CardTitle>
                    <CardDescription className="text-left text-muted-foreground">Map unique transport entities with verified corporate websites and technical fleet summaries.</CardDescription>
                </CardHeader>
                <CardContent className="px-0 text-left">
                    <TabsList className="h-auto flex-wrap justify-start bg-muted/30 mb-8 p-1">
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
