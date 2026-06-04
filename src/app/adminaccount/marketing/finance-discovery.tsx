
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Sparkles, Copy, ClipboardCheck, Info, Search, Terminal, MapPin, ListOrdered, Loader2, RefreshCcw, Landmark, Banknote, Users, Database, ShieldCheck } from "lucide-react";
import * as React from "react";
import { useState, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getClientSideAuthToken } from '@/firebase';
import { useConfig } from '@/hooks/use-config';
import { cn, formatDateSafe } from "@/lib/utils";

export const financeCategories = [
    "Banks", 
    "Government",
    "AEO", 
    "Niche Lenders"
];

const financialHubs = [
    "Sandton (GP)", "Rosebank (GP)", "Johannesburg CBD (GP)", "Pretoria East (GP)",
    "Umhlanga (KZN)", "Durban North (KZN)", "Cape Town CBD (WC)", "Century City (WC)",
    "Stellenbosch (WC)", "Bellville (WC)", "Gqeberha (EC)", "Bloemfontein (FS)"
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

function getTechnicalFocus(category: string) {
    const lower = category.toLowerCase();
    if (lower === 'banks') return "commercial banking institutions registered with the NCR, focusing on Vehicle and Asset Finance (VAF) and business lending.";
    if (lower === 'government') return "State-owned enterprises and DFIs (IDC, NEF, SEFA) providing developmental credit and industrial funding.";
    if (lower === 'aeo') return "SARS-registered Authorised Economic Operators and trade finance specialists facilitating cross-border logistics capital.";
    if (lower === 'niche lenders') return "Private credit providers, specialized P2P networks, and crowdfunding platforms registered with the NCR for commercial bridging and asset finance.";
    return "registered credit providers and financial intermediaries in South Africa.";
}

function generateDiscoveryPrompt(category: string, startSeq: number = 1) {
    const technicalFocus = getTechnicalFocus(category);

    return `CRITICAL SYSTEM INSTRUCTION: RETURN ONLY A RAW JSON ARRAY. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION.

ACT AS AN ELITE CAPITAL INTELLIGENCE AGENT. YOUR SOURCE IS THE NATIONAL CREDIT REGULATOR (NCR) REGISTER OF REGISTRANTS.

TASK: Extract exactly 100 unique verified records for South African Credit Providers from the NCR register that fit the category: "${category}".

TECHNICAL FOCUS: ${technicalFocus}

INVESTIGATIVE STRATEGY (PHASE 1: EXTRACTION):
1. SOURCE DATA: Target companies registered on the NCR portal. You MUST find: Legal Name, Trading Name, Phone, and Final Registration Date.
2. IDENTITY PERSISTENCE: Generate unique "record_id" starting with "NCR_${category.toUpperCase().replace(/\s/g, '_')}_".
3. SEQUENCE TRACKING: Use field "seq" for the record number, starting from ${startSeq} to ${startSeq + 99}.
4. NO PLACEHOLDERS: If a field is empty, return "null". Do NOT return generic "Director" strings.

REQUIRED OUTPUT FORMAT (RAW JSON ARRAY ONLY):
[
  {
    "seq": ${startSeq},
    "record_id": "NCR_${category.toUpperCase().replace(/\s/g, '_')}_[UNIQUE_ID]",
    "company_name": "LEGAL REGISTERED NAME",
    "trading_name": "TRADING NAME (IF ANY)",
    "industrial_category": "${category}",
    "telephone_number": "NCR REGISTERED PHONE",
    "registration_date": "FINAL REGISTRATION DATE",
    "research_status": "pending_enrichment"
  }
]

NOTE: This is Phase 1. Do not search for websites or staff yet. Focus on accurate NCR extraction.`;
}

const DiscoveryTab = ({ category, currentCount }: { category: string, currentCount: number }) => {
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);
    
    const prompt = generateDiscoveryPrompt(category, currentCount + 1);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(prompt);
            setIsCopied(true);
            toast({ title: "NCR Extraction Prompt Copied!", description: `Paste into Gemini 1.5 Pro to hunt for ${category}.` });
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
                        <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
                            <Database className="h-6 w-6 text-amber-600" />
                            NCR Discovery: {category}
                        </h2>
                        <Badge variant="outline" className="font-mono text-sm bg-muted/30">
                            {currentCount} / 9682
                        </Badge>
                    </div>
                    
                    <Alert className="bg-primary/5 border-primary/20 border-l-4 border-l-primary">
                        <Info className="h-4 w-4 text-primary" />
                        <AlertTitle className="font-bold text-sm">Two-Phase Strategy Active</AlertTitle>
                        <AlertDescription className="text-xs space-y-2">
                            <p><strong>Step 1:</strong> Use this prompt to extract raw data from the NCR register.</p>
                            <p><strong>Step 2:</strong> Once imported, use the "Enrich" button in the CRM to find websites, agreement types, and human decision-makers.</p>
                        </AlertDescription>
                    </Alert>

                    <div className="pt-4 flex flex-col gap-2">
                        <Button onClick={handleCopy} size="lg" className="w-full gap-2 shadow-md bg-amber-600 hover:bg-amber-700">
                            {isCopied ? <ClipboardCheck className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                            {isCopied ? "Prompt Copied" : `Copy NCR Extraction Prompt`}
                        </Button>
                        <Button variant="outline" asChild className="w-full">
                            <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer">
                                Open Google AI Studio <ArrowRight className="ml-2 h-4 w-4" />
                            </a>
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                            <Terminal className="h-3 w-3"/> Phase 1 Command
                        </Label>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-amber-600 border-amber-200">
                            NCR Optimized
                        </Badge>
                    </div>
                    <ScrollArea className="h-[320px] border rounded-lg bg-slate-900 p-4 shadow-inner">
                        <pre className="text-[10px] text-slate-300 font-mono whitespace-pre-wrap leading-tight">
                            {prompt}
                        </pre>
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
};

export default function FinanceDiscoveryEngine() {
    const { toast } = useToast();
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    const { data: statsData, isLoading: isStatsLoading, forceRefresh: refreshStats } = useConfig<any>('financeDiscoveryStats');
    const counts = statsData?.counts || {};

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            await performAdminAction(token, 'refreshFinanceCategoryCounts', {});
            toast({ title: "Finance Database Tally Complete", description: "All category counts have been updated." });
            refreshStats();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Refresh Failed", description: e.message });
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <Card className="shadow-none border-none">
            <Tabs defaultValue="Banks" className="w-full">
                <CardHeader className="px-0 pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-6 w-6 text-amber-500" />
                            Capital Intelligence Discovery
                        </CardTitle>
                        <CardDescription>
                            Targeted NCR register extraction for Banks, DFIs, AEO Partners, and Niche Lenders.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                         <div className="text-right mr-2 hidden md:block">
                            <p className="text-[10px] font-black uppercase text-muted-foreground">Registry Snapshot</p>
                            <p className="text-[10px] font-bold text-amber-600">{formatDateSafe(statsData?.lastUpdated, "dd MMM, HH:mm")}</p>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleRefresh} 
                            disabled={isRefreshing}
                            className="bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-700"
                        >
                            {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCcw className="mr-2 h-4 w-4" />}
                            Update Database Counts
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="px-0">
                    <TabsList className="h-auto flex-wrap justify-start bg-muted/30 mb-8 p-1">
                        {financeCategories.map(category => (
                            <TabsTrigger key={category} value={category} className="text-xs px-4 py-2 gap-1.5">
                                {category}
                                <span className={cn(
                                    "px-1.5 rounded-full text-[10px] font-black",
                                    (counts[category] || 0) > 0 ? "bg-amber-600/20 text-amber-700" : "bg-slate-200 text-slate-500"
                                )}>
                                    {isRefreshing ? '...' : (counts[category] || 0)}
                                </span>
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {financeCategories.map(category => (
                        <TabsContent key={category} value={category} className="mt-0">
                            <DiscoveryTab category={category} currentCount={counts[category] || 0} />
                        </TabsContent>
                    ))}
                </CardContent>
            </Tabs>
        </Card>
    );
}

