'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, ClipboardCheck, Info, Search, Terminal, Landmark, Database, Zap, ShieldCheck } from "lucide-react";
import * as React from "react";
import { useState, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const financeCategories = ["Banks", "Government", "AEO", "Niche Lenders"];

function getTechnicalFocus(category: string) {
    const lower = category.toLowerCase();
    if (lower === 'banks') return "commercial banking institutions registered with the NCR, focusing on Asset Finance and Commercial Lending divisions.";
    if (lower === 'government') return "Development Finance Institutions (DFIs) like IDC, NEF, or SEFA that provide industrial and expansion credit.";
    if (lower === 'aeo') return "SARS-registered Authorised Economic Operators and trade finance specialists facilitating cross-border logistics capital.";
    if (lower === 'niche lenders') return "ANY and ALL South African companies providing funding, credit, or financial assistance to INDIVIDUALS and BUSINESSES. Focus on private equity, venture debt, SME credit providers, micro-lenders, and specialized fintechs.";
    return "registered credit providers and financial intermediaries in South Africa.";
}

function generateDiscoveryPrompt(category: string, startSeq: number = 1) {
    const technicalFocus = getTechnicalFocus(category);

    return `ACT AS AN ELITE CAPITAL INTELLIGENCE AGENT AND FORENSIC INVESTIGATOR. 
RETURN ONLY A RAW JSON ARRAY. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION.

CRITICAL INTEGRITY SHIELD: 
DO NOT RETURN MOCK OR HALLUCINATED DATA. 
YOU MUST PERFORM A LIVE SEARCH FOR "${category} in South Africa" on professional directories, fintech news, and social platforms.

TASK: Discover and extract exactly 30 unique, live South African companies providing funding or credit for: "${category}".

TECHNICAL FOCUS: ${technicalFocus}

INVESTIGATIVE PROTOCOL:
1. HUMAN IDENTITY: Find the ACTUAL FULL NAME (First and Last) of the CEO, MD, or Head of Credit.
2. CONTACT MAPPING: Identify professional email and direct mobile numbers (+27 format).
3. RECORD KEY: Generate a unique "record_id" by slugifying the institution name (e.g. "NCR_FINANCE_ALT_CAPITAL").

REQUIRED JSON FIELDS:
[
  {
    "seq": ${startSeq},
    "record_id": "...",
    "companyName": "FULL INSTITUTION NAME",
    "industrial_category": "${category}",
    "contactPerson": "VERIFIED HUMAN NAME",
    "email": "...",
    "mobile": "...",
    "website": "OFFICIAL VERIFIED URL",
    "notes": "Detailed summary of their funding products and target client profile."
  }
]`;
}

const DiscoveryTab = ({ category, currentCount = 0 }: { category: string, currentCount?: number }) => {
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);
    const [seqOverride, setSeqOverride] = useState<number | ''>('');
    
    const startSeq = useMemo(() => (seqOverride !== '' ? Number(seqOverride) : currentCount + 1), [seqOverride, currentCount]);
    const prompt = useMemo(() => generateDiscoveryPrompt(category, startSeq), [category, startSeq]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(prompt);
        setIsCopied(true);
        toast({ title: "Forensic Prompt Ready", description: "Batch size optimized for accuracy." });
        setTimeout(() => setIsCopied(false), 3000);
    };

    return (
        <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="space-y-4">
                <h2 className="text-2xl font-bold font-headline flex items-center gap-2 text-foreground">
                    <Landmark className="h-6 w-6 text-primary" />
                    Capital Discovery: {category}
                </h2>
                
                <Alert className="bg-primary/5 border-primary/20">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <AlertTitle className="font-bold">Market Mapping Protocol</AlertTitle>
                    <AlertDescription className="text-xs text-muted-foreground">
                        Batching optimized at 30 records to ensure high-fidelity leadership contact extraction.
                    </AlertDescription>
                </Alert>

                <div className="p-4 bg-muted/30 border rounded-xl space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Sequence Sync</Label>
                    <div className="space-y-1.5">
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
                    Copy Discovery Prompt
                </Button>
            </div>

            <div className="space-y-2 text-left">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Terminal className="h-3 w-3"/> AI Forensic Command
                </Label>
                <ScrollArea className="h-[400px] border rounded-lg bg-slate-900 p-4 shadow-inner">
                    <pre className="text-[10px] text-slate-400 font-mono whitespace-pre-wrap leading-tight">
                        {prompt}
                    </pre>
                </ScrollArea>
            </div>
        </div>
    );
};

export default function FinanceDiscoveryEngine() {
    return (
        <Card className="shadow-none border-none text-left">
            <Tabs defaultValue="Niche Lenders" className="w-full">
                <CardHeader className="px-0 pt-0">
                    <CardTitle className="flex items-center gap-2 font-black font-headline">
                        <Database className="h-6 w-6 text-amber-500" />
                        Capital Intelligence Discovery
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Identify credit providers, private lenders, and specialized fintechs across South Africa.
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                    <TabsList className="h-auto flex-wrap justify-start bg-muted/30 mb-8 p-1">
                        {financeCategories.map(category => (
                            <TabsTrigger key={category} value={category} className="text-xs px-4 py-2">
                                {category}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {financeCategories.map(category => (
                        <TabsContent key={category} value={category} className="mt-0">
                            <DiscoveryTab category={category} />
                        </TabsContent>
                    ))}
                </CardContent>
            </Tabs>
        </Card>
    );
}
