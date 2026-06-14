
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
    if (lower === 'banks') return "commercial banking institutions registered with the NCR, focusing on Asset Finance and Commercial Lending divisions.";
    if (lower === 'government') return "Development Finance Institutions (DFIs) like IDC, NEF, or SEFA that provide industrial and expansion credit.";
    if (lower === 'aeo') return "SARS-registered Authorised Economic Operators and trade finance specialists facilitating cross-border logistics capital.";
    if (lower === 'niche lenders') return "Private credit providers, specialized P2P networks, and crowdfunding platforms registered with the NCR for asset-backed bridging.";
    return "registered credit providers and financial intermediaries in South Africa.";
}

function generateDiscoveryPrompt(category: string, startPage: number) {
    const technicalFocus = getTechnicalFocus(category);
    const endPage = startPage + 4;
    const startSeq = (startPage - 1) * 20 + 1;

    return `CRITICAL SYSTEM INSTRUCTION: RETURN ONLY A RAW JSON ARRAY. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION. NO EXPLANATORY TEXT.

ACT AS AN ELITE CAPITAL INTELLIGENCE AGENT. YOUR PRIMARY SOURCE IS LINKEDIN AND THE NATIONAL CREDIT REGULATOR (NCR) REGISTER.

TASK: Extract exactly 100 unique verified records for South African Credit Providers fitting the category: "${category}".

TECHNICAL FOCUS: ${technicalFocus}

REGISTRY NAVIGATION LOGIC:
1. PAGINATION: The NCR registry has 20 records per page. We are currently starting at record #${startSeq} which corresponds to NCR PAGE ${startPage}.
2. SCOPE: You are commanded to extract 100 records covering Pages ${startPage} through ${endPage} of the registry.
3. LINKEDIN SEARCH: Prioritize finding individual professional profiles on LinkedIn for staff in "Asset Finance", "Credit Risk", or "Commercial Lending" at these firms.
4. FORBIDDEN VALUES: Returning "The Director", "Manager", or "Unknown" is a failure. You MUST find a specific human full name.
5. IDENTITY PERSISTENCE: Generate unique "record_id" starting with "NCR_${category.toUpperCase().replace(/\s/g, '_')}_".

REQUIRED OUTPUT FORMAT (RAW JSON ARRAY ONLY):
[
  {
    "seq": ${startSeq},
    "record_id": "NCR_${category.toUpperCase().replace(/\s/g, '_')}_[RANDOM_ID]",
    "company_name": "LEGAL REGISTERED NAME",
    "industrial_category": "${category}",
    "contact_person": "ACTUAL HUMAN FULL NAME (CEO/MD/HEAD OF CREDIT)",
    "email_address": "Verified Direct Professional Email",
    "telephone_number": "Direct Office/Executive Line",
    "website": "Company URL",
    "research_status": "completed"
  }
]

HUNTING GROUNDS: Deep-search LinkedIn, NCR registry, and company "Leadership" pages.`;
}

const DiscoveryTab = ({ category, currentCount }: { category: string, currentCount: number }) => {
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);
    const [isAutoDiscovering, setIsAutoDiscovering] = useState(false);
    const [pageOverride, setPageOverride] = useState<number | ''>('');
    const [configError, setConfigError] = useState<string | null>(null);
    
    const suggestedPage = Math.floor(currentCount / 20) + 1;
    const startPage = pageOverride !== '' ? Number(pageOverride) : suggestedPage;
    const endPage = startPage + 4;

    const prompt = useMemo(() => generateDiscoveryPrompt(category, startPage), [category, startPage]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(prompt);
            setIsCopied(true);
            toast({ title: "Extraction Prompt Copied!", description: `Prompt targeting NCR Pages ${startPage} to ${endPage} is ready.` });
            setTimeout(() => setIsCopied(false), 3000);
        } catch (e) {
            toast({ variant: 'destructive', title: "Copy Failed" });
        }
    };

    const handleAutoDiscover = async () => {
        setIsAutoDiscovering(true);
        setConfigError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            const response = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'runAutomatedDiscovery',
                    payload: { category, type: 'finance', startPage }
                }),
            });

            const result = await response.json();
            
            if (!response.ok) {
                const errMessage = result.error || "Automation failed.";
                if (errMessage.includes('dunning') || errMessage.includes('403') || errMessage.includes('denied')) {
                    setConfigError(errMessage);
                }
                throw new Error(errMessage);
            }

            toast({ title: "Discovery Successful", description: `Identified and imported ${result.count} capital partners.` });
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Automation Failed", description: e.message });
        } finally {
            setIsAutoDiscovering(false);
        }
    };

    return (
        <div className="space-y-6">
            {configError && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Cloud API Error</AlertTitle>
                    <AlertDescription className="space-y-3">
                        <p className="font-mono text-[10px] bg-black/10 p-2 rounded">{configError}</p>
                        <p className="text-xs">This usually indicates the Generative Language API is disabled or there is a billing issue in your Google Cloud Project.</p>
                        <Button variant="outline" size="sm" asChild className="text-destructive-foreground border-destructive/20 hover:bg-destructive/10">
                            <Link href="/docs/enable-gemini-api.md" target="_blank">AI Setup Guide</Link>
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
                            <Database className="h-6 w-6 text-amber-500" />
                            NCR Discovery: {category}
                        </h2>
                    </div>
                    
                    <div className="p-4 bg-primary/5 border rounded-xl space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Pagination Control</Label>
                            <Badge variant="default" className="bg-primary/20 text-primary border-none text-[10px] font-black uppercase">Suggested: Page {suggestedPage}</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 space-y-1.5 text-left">
                                <Label className="text-xs font-bold">Start from NCR Page #</Label>
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
                        <Button 
                            variant="default" 
                            size="lg" 
                            className="w-full gap-2 shadow-lg bg-amber-600 hover:bg-amber-700" 
                            onClick={handleAutoDiscover} 
                            disabled={isAutoDiscovering}
                        >
                            {isAutoDiscovering ? <Loader2 className="h-5 w-5 animate-spin"/> : <Zap className="h-5 w-5" />}
                            {isAutoDiscovering ? 'Running Discovery...' : "Run AI Discovery (Batch of 100)"}
                        </Button>
                        <Button onClick={handleCopy} variant="outline" size="lg" className="w-full gap-2 shadow-sm border-amber-200 text-amber-700 hover:bg-amber-50" disabled={isAutoDiscovering}>
                            {isCopied ? <ClipboardCheck className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                            {isCopied ? "Prompt Copied" : `Copy Manual Prompt (Pages ${startPage} - ${endPage})`}
                        </Button>
                        <Button variant="ghost" asChild className="w-full text-xs opacity-70">
                            <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer">
                                External AI Studio <ArrowRight className="ml-1 h-3 w-3" />
                            </a>
                        </Button>
                    </div>
                </div>

                <div className="space-y-2 text-left">
                    <div className="flex items-center justify-between">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                            <Terminal className="h-3 w-3"/> AI Forensic Command
                        </Label>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-amber-600 border-amber-200">
                            Targeting Page {startPage}
                        </Badge>
                    </div>
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

export default function FinanceDiscoveryEngine() {
    const { toast } = useToast();
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    const { data: statsData, forceRefresh: refreshStats } = useConfig<any>('financeDiscoveryStats');
    const counts = statsData?.counts || {};

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            await performAdminAction(token, 'refreshFinanceCategoryCounts', {});
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
            <Tabs defaultValue="Banks" className="w-full">
                <CardHeader className="px-0 pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 text-left">
                        <CardTitle className="flex items-center gap-2 text-left">
                            <Landmark className="h-6 w-6 text-amber-500" />
                            Capital Intelligence Discovery
                        </CardTitle>
                        <CardDescription className="text-left">
                            Identify credit providers from the NCR Register.
                        </CardDescription>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRefresh} 
                        disabled={isRefreshing}
                        className="bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-700"
                    >
                        {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCcw className="mr-2 h-4 w-4" />}
                        Refresh Tally
                    </Button>
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
                        <TabsContent key={category} value={category} className="mt-0 text-left">
                            <DiscoveryTab category={category} currentCount={counts[category] || 0} />
                        </TabsContent>
                    ))}
                </CardContent>
            </Tabs>
        </Card>
    );
}
