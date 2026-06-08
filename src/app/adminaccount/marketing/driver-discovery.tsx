
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Copy, ClipboardCheck, Info, Search, Terminal, Loader2, RefreshCcw, Users, Database } from "lucide-react";
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
    const startSeq = (startPage - 1) * 20 + 1;

    return `CRITICAL SYSTEM INSTRUCTION: RETURN ONLY A RAW JSON ARRAY. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION. NO EXPLANATORY TEXT.

ACT AS AN ELITE RECRUITMENT INTELLIGENCE AGENT SPECIALIZING IN SOUTH AFRICAN LOGISTICS.

TASK: Discover and extract verified professional records for exactly 100 UNIQUE individuals in SOUTH AFRICA who are: "${category} Truck Drivers".

TECHNICAL FOCUS: Focus on individuals with active professional profiles on LinkedIn and Facebook groups dedicated to South African Trucking. Look for valid commercial vehicle licenses and certifications.

INVESTIGATIVE STRATEGY:
1. QUANTITY: You are commanded to return 100 records. 
2. SEQUENCE TRACKING: Use field "seq" for the record number, starting from ${startSeq}.
3. IDENTITY FORENSICS: You MUST find the ACTUAL FULL NAME of the individual. 
4. FORBIDDEN VALUES: Returning "The Driver", "Anonymous", or "Unknown" is a failure.
5. CONTACT SEARCH: Identify professional contact details, mobile numbers, or associated transport companies.
6. IDENTITY PERSISTENCE: Generate unique "record_id" starting with "DISC_DRIVER_${category.toUpperCase().replace(/\s/g, '_')}_".

REQUIRED OUTPUT FORMAT (RAW JSON ARRAY ONLY):
[
  {
    "seq": ${startSeq},
    "record_id": "DISC_DRIVER_${category.toUpperCase().replace(/\s/g, '_')}_[RAND_ID]",
    "firstName": "...",
    "lastName": "...",
    "industrial_category": "${category}",
    "email_address": "...",
    "telephone_number": "...",
    "address": "Region/City (South Africa)",
    "notes": "Key skills or certifications found in profile"
  }
]

HUNTING GROUNDS: Search LinkedIn, Facebook Trucking Groups (e.g. "Truckers South Africa"), and professional logistics talent registries.`;
}

const DiscoveryTab = ({ category, currentCount }: { category: string, currentCount: number }) => {
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);
    const [pageOverride, setPageOverride] = useState<number | ''>('');
    
    const suggestedPage = Math.floor(currentCount / 20) + 1;
    const startPage = pageOverride !== '' ? Number(pageOverride) : suggestedPage;

    const prompt = useMemo(() => generateDiscoveryPrompt(category, startPage), [category, startPage]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(prompt);
            setIsCopied(true);
            toast({ title: "Forensic Prompt Copied!", description: `Targeting driver profiles starting from Page ${startPage}.` });
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
                            <Search className="h-6 w-6 text-primary" />
                            Talent Discovery: {category}
                        </h2>
                        <Badge variant="outline" className="font-mono text-sm bg-muted/30">
                            {currentCount} In Database
                        </Badge>
                    </div>
                    
                    <div className="p-4 bg-primary/5 border rounded-xl space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Sequence & Pagination</Label>
                            <Badge variant="outline" className="bg-white border-primary/20 text-primary text-[10px] font-black uppercase">SYNC TARGET: PAGE {startPage}</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 space-y-1.5">
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
                        <Button onClick={handleCopy} size="lg" className="w-full gap-2 shadow-sm">
                            {isCopied ? <ClipboardCheck className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
                            {isCopied ? "Prompt Copied" : "Copy Manual Prompt"}
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <Terminal className="h-3 w-3"/> Forensic Talent Command
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
            <Tabs defaultValue="Code 14 Heavy" className="w-full">
                <CardHeader className="px-0 pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-6 w-6 text-primary" />
                            Driver Talent Discovery
                        </CardTitle>
                        <CardDescription>
                            Identify and extract verified professional drivers from Facebook and LinkedIn.
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
