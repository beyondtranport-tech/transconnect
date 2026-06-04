
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Sparkles, Copy, ClipboardCheck, Info, Search, Terminal, MapPin, ListOrdered, Loader2, RefreshCcw, Landmark, Banknote, Users } from "lucide-react";
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
    "Asset Finance", 
    "Working Capital",
    "Debt Funders", 
    "Niche Lenders", 
    "Bridging", 
    "Insurance"
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
    if (lower.includes('asset')) return "heavy commercial vehicle finance, truck and trailer leasing, and installment sale agreements for the transport industry";
    if (lower.includes('working capital')) return "short-term business loans, bridging finance, and cash flow solutions for SMMES in logistics";
    if (lower.includes('debt')) return "alternative debt funding, venture debt, and large-scale commercial credit facilities";
    if (lower.includes('niche')) return "specialized transport sector lenders, owner-operator funding schemes, and development finance";
    if (lower.includes('bridging')) return "fuel advance bridging, invoice discounting, and purchase order funding for transporters";
    if (lower.includes('insurance')) return "heavy commercial vehicle insurance, goods-in-transit (GIT) cover, and specialized transport liability";
    return "capital providers and financial services specifically targeting the South African transport and logistics sector";
}

function generateDiscoveryPrompt(category: string, focusHubs: string[]) {
    const technicalFocus = getTechnicalFocus(category);

    return `CRITICAL SYSTEM INSTRUCTION: RETURN ONLY A RAW JSON ARRAY. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION. NO EXPLANATORY TEXT.

ACT AS AN ELITE CAPITAL INTELLIGENCE AGENT. YOUR PRIMARY MISSION IS TO IDENTIFY ACTUAL HUMAN BEINGS IN LEADERSHIP AT SOUTH AFRICAN FINANCE COMPANIES.

TASK: Discover and extract detailed verified records for exactly 50 DIFFERENT AND UNIQUE private-sector financial entities in SOUTH AFRICA that provide: "${category}".

INDUSTRY CONTEXT: These funders MUST serve the transport and logistics industry (${technicalFocus}).

HUNTING GROUNDS: 
1. PRIMARY SOURCE: LinkedIn. You are strictly commanded to find records of the STAFF who work for these companies.
2. SECONDARY SOURCE: National Credit Regulator (NCR) database to cross-reference and verify the company's legal standing as a private lender.

TARGET STAFF TITLES:
You are hunting for individuals with roles such as: CEO, Managing Director, Head of Asset Finance, Credit Risk Manager, Commercial Lending Head, or Logistics Specialist Partner.

STRICT EXCLUSIONS:
1. NO GOVERNMENT ENTITIES: Do NOT return government departments, SOEs (e.g. IDC, NEF), or municipal agencies.
2. NO CALL CENTERS: Do NOT return anonymous "0860" numbers or general helpdesks. You need direct human-to-human contact details.

INVESTIGATIVE STRATEGY:
1. HUMAN IDENTITY FIRST: You must find the ACTUAL NAME (First and Last) of a specific decision-maker via LinkedIn or official corporate "About Us" leadership pages.
2. FORBIDDEN VALUES: Returning titles like "The Director", "Branch Manager", or "Managing Director" without a name is a failure. You MUST find a specific human identity (e.g. "Sipho Nkosi").
3. IDENTITY PERSISTENCE: Generate unique "record_id" starting with "FIN_${category.toUpperCase().replace(/\s/g, '_')}_".

REQUIRED OUTPUT FORMAT (RAW JSON ARRAY ONLY):
[
  {
    "seq": 1,
    "record_id": "FIN_${category.toUpperCase().replace(/\s/g, '_')}_[RAND_ID]",
    "company_name": "...",
    "industrial_category": "${category}",
    "contact_person": "VERIFIED HUMAN FULL NAME FROM LINKEDIN",
    "email_address": "Direct Executive or Professional Email",
    "telephone_number": "Direct Office or Work Mobile Number",
    "website": "URL",
    "physical_address": "..."
  }
]`;
}

const DiscoveryTab = ({ category, currentCount }: { category: string, currentCount: number }) => {
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);
    
    const randomHubs = useMemo(() => {
        const shuffled = [...financialHubs].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 4);
    }, [category]);

    const prompt = generateDiscoveryPrompt(category, randomHubs);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(prompt);
            setIsCopied(true);
            toast({ title: "Staff Forensic Prompt Copied!", description: `Paste into Gemini to hunt for human contacts.` });
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
                            <Users className="h-6 w-6 text-amber-600" />
                            Staff Discovery: {category}
                        </h2>
                        <Badge variant="outline" className="font-mono text-sm bg-muted/30">
                            {currentCount} In Database
                        </Badge>
                    </div>
                    
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-amber-600 shrink-0" />
                        <div className="text-xs text-amber-900">
                            <span className="font-bold uppercase">Targeted Hub Focus:</span>
                            <p className="font-semibold mt-0.5">{randomHubs.join(' • ')}</p>
                        </div>
                    </div>

                    <Alert className="bg-primary/5 border-primary/20 border-l-4 border-l-primary">
                        <Info className="h-4 w-4 text-primary" />
                        <AlertTitle className="font-bold text-sm">LinkedIn Priority Mode</AlertTitle>
                        <AlertDescription className="text-xs space-y-2">
                            <p>This prompt is optimized to bypass call centers. It commands the AI to use <strong>LinkedIn</strong> to find the specific names of decision-makers and cross-reference them with the <strong>NCR registry</strong>.</p>
                        </AlertDescription>
                    </Alert>

                    <div className="pt-4 flex flex-col gap-2">
                        <Button onClick={handleCopy} size="lg" className="w-full gap-2 shadow-md bg-amber-600 hover:bg-amber-700">
                            {isCopied ? <ClipboardCheck className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                            {isCopied ? "Prompt Copied" : "Copy Staff Forensic Prompt"}
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
                            <Terminal className="h-3 w-3"/> LinkedIn Forensic Command
                        </Label>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-amber-600 border-amber-200">
                            Identity Centric
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
            <Tabs defaultValue="Asset Finance" className="w-full">
                <CardHeader className="px-0 pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-6 w-6 text-amber-500" />
                            AI Capital Discovery Engine
                        </CardTitle>
                        <CardDescription>
                            Generate forensic prompts to discover human contacts and decision-makers at NCR-registered lenders.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                         <div className="text-right mr-2 hidden md:block">
                            <p className="text-[10px] font-black uppercase text-muted-foreground">Snapshot Taken</p>
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
