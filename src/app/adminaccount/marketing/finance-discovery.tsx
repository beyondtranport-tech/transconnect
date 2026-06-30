'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Copy, ClipboardCheck, Info, Search, Terminal, Loader2, RefreshCcw, Landmark, Database, Zap, AlertTriangle } from "lucide-react";
import * as React from "react";
import { useState, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getClientSideAuthToken } from '@/firebase';
import { useConfig } from '@/hooks/use-config';
import { cn, formatDateSafe } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import Link from 'next/link';

export const financeCategories = [
    "Banks", 
    "Government",
    "AEO", 
    "Niche Lenders"
];

function getTechnicalFocus(category: string) {
    const lower = category.toLowerCase();
    if (lower === 'banks') return "commercial banking institutions registered with the NCR, focusing on Asset Finance and Commercial Lending divisions.";
    if (lower === 'government') return "Development Finance Institutions (DFIs) like IDC, NEF, or SEFA that provide industrial and expansion credit.";
    if (lower === 'aeo') return "SARS-registered Authorised Economic Operators and trade finance specialists facilitating cross-border logistics capital.";
    if (lower === 'niche lenders') return "ANY and ALL South African companies providing funding, credit, or financial assistance to INDIVIDUALS and BUSINESSES. Focus on private equity, venture debt, SME credit providers, micro-lenders, and specialized fintechs outside of the traditional 'Big 4' banks.";
    return "registered credit providers and financial intermediaries in South Africa.";
}

function generateDiscoveryPrompt(category: string, startPage: number) {
    const technicalFocus = getTechnicalFocus(category);
    const startSeq = (startPage - 1) * 30 + 1;

    return `ACT AS AN ELITE CAPITAL INTELLIGENCE AGENT. 
RETURN ONLY A RAW JSON ARRAY. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION.

TASK: Discover and extract exactly 30 unique, live South African companies providing funding or credit to individuals and businesses for the category: "${category}".

TECHNICAL FOCUS: ${technicalFocus}

INVESTIGATIVE PROTOCOL:
1. BROAD SEARCH: Do not limit yourself to listed entities. Research private credit providers, fintech startups, and SME funding agencies.
2. VERIFY LIVE PRESENCE: Ensure the company has an active, professional website or social presence (LinkedIn/Facebook).
3. HUMAN IDENTITY: Find the ACTUAL FULL NAME of the CEO, MD, or Head of Credit.
4. CONTACT MAPPING: Identify professional email and direct mobile numbers (+27 format).
5. RECORD KEY: Generate a unique "record_id" starting with "NCR_${category.toUpperCase().replace(/\s/g, '_')}_".

REQUIRED JSON FIELDS:
[
  {
    "seq": ${startSeq},
    "record_id": "...",
    "companyName": "FULL LEGAL NAME",
    "industrial_category": "${category}",
    "contact_person": "VERIFIED HUMAN NAME",
    "email": "...",
    "mobile": "...",
    "website": "OFFICIAL VERIFIED URL",
    "notes": "Detailed summary of their funding products (e.g. asset-backed loans, invoice factoring, personal credit) and their target client profile."
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
        try {
            await navigator.clipboard.writeText(prompt);
            setIsCopied(true);
            toast({ title: "Extraction Prompt Copied!" });
            setTimeout(() => setIsCopied(false), 3000);
        } catch (e) {
            toast({ variant: 'destructive', title: "Copy Failed" });
        }
    };

    return (
        <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="space-y-4">
                <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
                    <Database className="h-6 w-6 text-amber-500" />
                    Capital Discovery: {category}
                </h2>
                
                <div className="p-4 bg-primary/5 border rounded-xl space-y-4 text-left">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Pagination Control</Label>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 space-y-1.5">
                            <Label className="text-xs font-bold">Start from Discovery Batch #</Label>
                            <Input 
                                type="number" 
                                placeholder={String(suggestedPage)}
                                value={pageOverride}
                                onChange={(e) => setPageOverride(e.target.value === '' ? '' : Number(e.target.value))}
                                className="h-10 font-mono font-bold text-lg"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                    <Button onClick={handleCopy} variant="outline" size="lg" className="w-full gap-2 shadow-sm border-amber-200 text-amber-700 hover:bg-amber-50">
                        {isCopied ? <ClipboardCheck className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                        {isCopied ? "Prompt Copied" : `Copy Forensic Prompt`}
                    </Button>
                </div>
            </div>

            <div className="space-y-2 text-left">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 text-left">
                    <Terminal className="h-3 w-3"/> AI Forensic Command
                </Label>
                <ScrollArea className="h-[400px] border rounded-lg bg-slate-900 p-4 shadow-inner text-left">
                    <pre className="text-[10px] text-slate-400 font-mono whitespace-pre-wrap leading-tight text-left">
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
            <Tabs defaultValue="Banks" className="w-full text-left">
                <CardHeader className="px-0 pt-0 text-left">
                    <CardTitle className="flex items-center gap-2 text-left">
                        <Landmark className="h-6 w-6 text-amber-500" />
                        Capital Intelligence Discovery
                    </CardTitle>
                    <CardDescription className="text-left text-muted-foreground">
                        Identify credit providers, private lenders, and specialized fintechs across South Africa.
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-0 text-left">
                    <TabsList className="h-auto flex-wrap justify-start bg-muted/30 mb-8 p-1">
                        {financeCategories.map(category => (
                            <TabsTrigger key={category} value={category} className="text-xs px-4 py-2">
                                {category}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {financeCategories.map(category => (
                        <TabsContent key={category} value={category} className="mt-0 text-left">
                            <DiscoveryTab category={category} currentCount={0} />
                        </TabsContent>
                    ))}
                </CardContent>
            </Tabs>
        </Card>
    );
}
