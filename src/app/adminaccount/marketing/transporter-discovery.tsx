
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Copy, ClipboardCheck, Info, Search, Terminal, RefreshCcw, Database, Loader2, Zap } from "lucide-react";
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

export const transporterCategories = [
    "Long Haul",
    "Refrigerated",
    "Flatbed",
    "Tipper",
    "Hazmat",
    "LTL",
    "Cross-Border",
    "Local Distribution",
    "Container Transport",
    "Abnormal Loads"
];

async function performAdminAction(token: string, action: string, payload: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
        cache: 'no-store'
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || `API Error: ${action}`);
    return result;
}

function generateDiscoveryPrompt(category: string, startPage: number) {
    const startSeq = (startPage - 1) * 100 + 1;

    return `CRITICAL SYSTEM INSTRUCTION: RETURN ONLY A RAW JSON ARRAY. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION. NO EXPLANATORY TEXT.

ACT AS AN ELITE INDUSTRIAL FORENSIC INVESTIGATOR.

TASK: Discover and extract exactly 100 UNIQUE transport companies in SOUTH AFRICA for the category: "${category}".

STRICT FORENSIC PROTOCOL:
1. DATA MINING: Find the OFFICIAL CORPORATE WEBSITE. You must SCRAPE/EXTRACT the technical service wording from the site.
2. TECHNICAL FOCUS: In the "notes" field, provide a 2-3 sentence summary of SPECIFIC fleet capabilities (e.g. 34t Side-Tippers, tri-axle tautliners, SADC corridors, reefer temperature zones).
3. FORBIDDEN WORDS (BLACKLIST): innovative, leading, spearheading, solutions, backbone, ecosystem, commitment. Use only FACTUAL, TECHNICAL descriptors.
4. IDENTITY: Find the ACTUAL NAME (First and Last) of the Managing Director, Owner, or CEO.
5. RECORD KEY (UNIQUE ID): Generate a unique "record_id" starting with "DISC_TRANS_${category.toUpperCase().replace(/\s/g, '_')}_[HASH]". Use a deterministic hash of the company name to avoid duplicates.
6. WEBSITE VERIFICATION: Exclude sars.gov.za, gov.za, linkedin, and directories. Return only direct corporate domains.

REQUIRED OUTPUT FORMAT (RAW JSON ARRAY ONLY):
[
  {
    "seq": ${startSeq},
    "record_id": "STABLE_UNIQUE_ID",
    "company_name": "FULL LEGAL NAME",
    "industrial_category": "${category}",
    "contact_person": "ACTUAL HUMAN FULL NAME",
    "email_address": "Verified Professional Email",
    "telephone_number": "...",
    "website": "OFFICIAL CORPORATE URL ONLY",
    "physical_address": "FULL Street, Suburb, City, Province",
    "notes": "TECHNICAL SERVICE SUMMARY (NO FLUFF)"
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
        try {
            await navigator.clipboard.writeText(prompt);
            setIsCopied(true);
            toast({ title: "Forensic Prompt Copied!", description: `Targeting sequence starting from Page ${startPage}.` });
            setTimeout(() => setIsCopied(false), 3000);
        } catch (e) {
            toast({ variant: 'destructive', title: "Copy Failed" });
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold font-headline flex items-center gap-2 text-left">
                            <Search className="h-6 w-6 text-primary" />
                            Forensic Hub: {category}
                        </h2>
                    </div>
                    
                    <div className="p-4 bg-primary/5 border rounded-xl space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Pagination Control</Label>
                            <Badge variant="outline" className="bg-white border-primary/20 text-primary text-[10px] font-black uppercase">SYNC TARGET: PAGE {startPage}</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 space-y-1.5 text-left">
                                <Label className="text-xs font-bold">Start from Page #</Label>
                                <Input 
                                    type="number" 
                                    placeholder={String(suggestedPage)}
                                    value={pageOverride}
                                    onChange={(e) => setPageOverride(e.target.value === '' ? '' : Number(e.target.value))}
                                    className="h-10 font-mono font-bold text-lg"
                                />
                            </div>
                             <div className="pt-6">
                                <Button variant="ghost" size="sm" className="text-[10px] uppercase font-bold" onClick={() => setPageOverride('')}>
                                    <RefreshCcw className="mr-1 h-3 w-3" /> Auto
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                        <Button onClick={handleCopy} size="lg" className="w-full gap-2 shadow-lg h-14 bg-primary hover:bg-primary/90">
                            {isCopied ? <ClipboardCheck className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                            {isCopied ? "Prompt Ready" : "Copy Forensic Discovery Prompt"}
                        </Button>
                        <p className="text-[10px] text-muted-foreground text-center italic">Includes automated forensic mining and technical summary commands.</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 text-left">
                        <Terminal className="h-3 w-3"/> Forensic Haulier Command
                    </Label>
                    <ScrollArea className="h-[400px] border rounded-lg bg-slate-900 p-4 shadow-inner">
                        <pre className="text-[10px] text-slate-400 font-mono whitespace-pre-wrap leading-tight">
                            {prompt}
                        </pre>
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
};

export default function TransporterDiscoveryEngine() {
    const { toast } = useToast();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { data: statsData, forceRefresh: refreshStats } = useConfig<any>('transporterDiscoveryStats');
    const counts = statsData?.counts || {};

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            await performAdminAction(token, 'refreshTransporterCategoryCounts', {});
            toast({ title: "Registry Tally Complete" });
            refreshStats();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Refresh Failed", description: e.message });
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <Card className="shadow-none border-none">
            <Tabs defaultValue="Long Haul" className="w-full">
                <CardHeader className="px-0 pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-left">
                            <Database className="h-6 w-6 text-primary" />
                            Forensic Haulier Discovery
                        </CardTitle>
                        <CardDescription className="text-left">
                            Identify transport partners and automatically mine their technical profiles using high-fidelity prompts.
                        </CardDescription>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRefresh} 
                        disabled={isRefreshing}
                        className="bg-primary/5 border-primary/20 hover:bg-primary/10"
                    >
                        {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCcw className="mr-2 h-4 w-4" />}
                        Refresh Tally
                    </Button>
                </CardHeader>
                <CardContent className="px-0">
                    <TabsList className="h-auto flex-wrap justify-start bg-muted/30 mb-8 p-1">
                        {transporterCategories.map(category => (
                            <TabsTrigger key={category} value={category} className="text-xs px-4 py-2 gap-1.5">
                                {category}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {transporterCategories.map(category => (
                        <TabsContent key={category} value={category} className="mt-0">
                            <DiscoveryTab category={category} currentCount={counts[category] || 0} />
                        </TabsContent>
                    ))}
                </CardContent>
            </Tabs>
        </Card>
    );
}
