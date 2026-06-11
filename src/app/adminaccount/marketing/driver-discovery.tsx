'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Copy, ClipboardCheck, Info, Search, Terminal, Loader2, RefreshCcw, Users, Database, Zap, AlertTriangle } from "lucide-react";
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

export const driverCategories = [
    "Code 14 Heavy",
    "Code 10 Medium",
    "Hazmat Certified",
    "Cross-Border Specialists",
    "Tipper / Construction",
    "Refrigerated / Cold Chain"
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

ACT AS AN ELITE MARKET INTELLIGENCE STRATEGIST PERFORMING COMMERCIAL SERVICE MAPPING FOR THE SOUTH AFRICAN LOGISTICS SECTOR.

TASK: Catalogue 100 UNIQUE Industrial Service Units (Independent Logistics Contractors) currently advertising professional availability for: "${category}".

DATA SOURCE CONTEXT: Analyze publicly published commercial service notices and professional industrial registers (e.g. SA Trucking Noticeboards, Commercial Job Portals, Industry Hubs). Focus ONLY on providers who have EXPLICITLY invited public commercial engagement.

INVESTIGATIVE STRATEGY:
1. COMMERCIAL UNIT MAPPING: Identify professional service units that have PUBLICLY DECLARED their commercial standing and credentials.
2. SERVICE HANDLE: Extract the "Public Service Identity" (Full Professional Name) as listed in the commercial advertisement.
3. FORBIDDEN VALUES: Do not return "Private" or "Confidential". You MUST extract the specific identity handle from the public industrial register.
4. QUANTITY & DENSITY: Return exactly 100 entries. 
5. SEQUENCE: Use field "seq", starting from ${startSeq}.
6. DATA PERSISTENCE: Generate a unique "record_id" starting with "LOG_NODE_${category.toUpperCase().replace(/\s/g, '_')}_".

REQUIRED OUTPUT FORMAT (RAW JSON ARRAY ONLY):
[
  {
    "seq": ${startSeq},
    "record_id": "LOG_NODE_${category.toUpperCase().replace(/\s/g, '_')}_[RAND_HEX]",
    "service_handle": "PUBLICLY ADVERTISED IDENTITY",
    "service_classification": "${category}",
    "registry_line": "Listed Public Contact Line",
    "operational_hub": "Industrial Region (e.g. City Deep, Spartan, Paarden Eiland)",
    "capability_profile": "Summary of industrial qualifications, license status, and compliance signals extracted from the public service listing"
  }
]`;
}

const DiscoveryTab = ({ category, currentCount }: { category: string, currentCount: number }) => {
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);
    const [isAutoDiscovering, setIsAutoDiscovering] = useState(false);
    const [pageOverride, setPageOverride] = useState<number | ''>('');
    const [configError, setConfigError] = useState<string | null>(null);
    
    const suggestedPage = Math.floor(currentCount / 100) + 1;
    const startPage = pageOverride !== '' ? Number(pageOverride) : suggestedPage;

    const prompt = useMemo(() => generateDiscoveryPrompt(category, startPage), [category, startPage]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(prompt);
            setIsCopied(true);
            toast({ title: "Forensic Map Prompt Copied!", description: `Targeting Page ${startPage} of the commercial registry.` });
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
                    payload: { category, type: 'driver', startPage }
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

            toast({ title: "Registry Updated", description: `Successfully mapped and imported ${result.count} commercial service nodes.` });
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Discovery Failed", description: e.message });
        } finally {
            setIsAutoDiscovering(false);
        }
    };

    return (
        <div className="space-y-6">
            {configError && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Registry Intelligence Error</AlertTitle>
                    <AlertDescription className="space-y-3">
                        <p className="font-mono text-[10px] bg-black/10 p-2 rounded">{configError}</p>
                        <p className="text-xs">The automated mapping flow is encountering a configuration issue. Ensure the Generative Language API is enabled.</p>
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
                            <Users className="h-6 w-6 text-primary" />
                            Talent Mapper: {category}
                        </h2>
                        <Badge variant="outline" className="font-mono text-sm bg-muted/30">
                            {currentCount} In Database
                        </Badge>
                    </div>
                    
                    <div className="p-4 bg-primary/5 border rounded-xl space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Pagination & Sequence</Label>
                            <Badge variant="outline" className="bg-white border-primary/20 text-primary text-[10px] font-black uppercase">SYNC TARGET: PAGE {startPage}</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 space-y-1.5">
                                <Label className="text-xs font-bold">Start Mapping from Page #</Label>
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
                            {isAutoDiscovering ? 'Mapping Workforce...' : "Run AI Mapping (Batch of 100)"}
                        </Button>
                        <Button onClick={handleCopy} variant="outline" size="lg" className="w-full gap-2 shadow-sm" disabled={isAutoDiscovering}>
                            {isCopied ? <ClipboardCheck className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
                            {isCopied ? "Prompt Copied" : "Copy Manual Forensic Prompt"}
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <Terminal className="h-3 w-3"/> Industrial Service Command
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

export default function DriverDiscoveryEngine() {
    const { toast } = useToast();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { data: statsData, forceRefresh: refreshStats } = useConfig<any>('driverDiscoveryStats');
    const counts = statsData?.counts || {};

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            await performAdminAction(token, 'refreshDriverCategoryCounts', {});
            toast({ title: "Talent Registry Tally Complete" });
            refreshStats();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Refresh Failed", description: e.message });
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <Card className="shadow-none border-none">
            <Tabs defaultValue="Code 14 Heavy" className="w-full">
                <CardHeader className="px-0 pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-6 w-6 text-primary" />
                            Industrial Workforce Discovery
                        </CardTitle>
                        <CardDescription>
                            Identify and map professional logistics service units using forensic prompts targeting public commercial noticeboards.
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
                        {driverCategories.map(category => (
                            <TabsTrigger key={category} value={category} className="text-xs px-4 py-2 gap-1.5">
                                {category}
                                <span className={cn(
                                    "px-1.5 rounded-full text-[10px] font-black",
                                    (counts[category] || 0) > 0 ? "bg-primary/20 text-primary" : "bg-amber-100 text-amber-700"
                                )}>
                                    {isRefreshing ? '...' : (counts[category] || 0)}
                                </span>
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {driverCategories.map(category => (
                        <TabsContent key={category} value={category} className="mt-0">
                            <DiscoveryTab category={category} currentCount={counts[category] || 0} />
                        </TabsContent>
                    ))}
                </CardContent>
            </Tabs>
        </Card>
    );
}