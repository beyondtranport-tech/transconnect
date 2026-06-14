
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Copy, ClipboardCheck, Info, Search, Terminal, ListOrdered, Loader2, RefreshCcw, Database, Zap, AlertTriangle } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import Link from 'next/link';

export const supplierCategories = [
    "Accessories", 
    "Air",
    "Anti-Theft Devices", 
    "Auto Electrical", 
    "Batteries", 
    "Brakes", 
    "Cleaning Products",
    "Diesel", 
    "Differential",
    "Engine Refurbish",
    "Filters", 
    "Injectors", 
    "Lights", 
    "Mechanical repairs",
    "Oils & Lubricants", 
    "Parts", 
    "Prop Shafts",
    "Second Hand Trailers",
    "Second Hand Trucks",
    "Transport", 
    "Tarpaulins", 
    "Tow in", 
    "Trailer repairs", 
    "Truck Accessories", 
    "Truck Parts", 
    "Truck repairs", 
    "Turbo", 
    "Tyres"
];

const industrialHubs = [
    "Isando (GP)", "Jet Park (GP)", "Spartan (GP)", "Aeroton (GP)", "City Deep (GP)", "Alrode (GP)", "Wadeville (GP)", "Midrand (GP)", "Sunderland Ridge (GP)", "Rosslyn (GP)", "Silverton (GP)", "Roodekop (GP)", "Clayville (GP)", "Vanderbijlpark (GP)", "Vereeniging (GP)", "Heidelberg (GP - N3)",
    "Epping (WC)", "Montague Gardens (WC)", "Paarden Eiland (WC)", "Stikland (WC)", "Blackheath (WC)", "Airport Industria (WC)", "Killarney Gardens (WC)", "Saldanha (WC)", "George (WC - N2)", "Mossel Bay (WC - N2)", "Worcester (WC - N1)", "Beaufort West (WC - N1)", "Paarl (WC - N1)",
    "Pinetown (KZN)", "Westmead (KZN)", "Mobeni (KZN)", "Prospecton (KZN)", "Richards Bay (KZN - N2)", "New Germany (KZN)", "Phoenix Industrial (KZN)", "Port Shepstone (KZN - N2)", "Empangeni (KZN)", "Mandeni (KZN)", "Newcastle (KZN)", "Ladysmith (KZN)", "Pietermaritzburg (KZN)",
    "Bloemfontein (FS - N1)", "Kroonstad (FS - N1)", "Sasolburg (FS - N1)", "Harrismith (FS - N3)", "Welkom (FS)",
    "Struandale (EC)", "Deal Party (EC)", "Markman (EC)", "East London (EC - N2)", "Mthatha (EC - N2)", "Gqeberha (EC - N2)", "Uitenhage (EC)",
    "Polokwane (LP - N1)", "Musina (LP - N1)", "Louis Trichardt (LP - N1)", "Mokopane (LP - N1)", "Lephalale (LP)", "Thohoyandou (LP)",
    "Witbank/Emalahleni (MP - N4)", "Middelburg (MP - N11)", "Nelspruit/Mbombela (MP - N4)", "Secunda (MP)", "Ermelo (MP - N2)", "Barberton (MP)",
    "Rustenburg (NW)", "Potchefstroom (NW)", "Klerksdorp (NW)", "Brits (NW)", "Vryburg (NW)", "Mahikeng (NW)"
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
    if (lower === 'air') return "heavy commercial vehicle air systems, including air brakes, compressors, air dryers, valves, and pneumatic connections between horse and trailer";
    if (lower.includes('second hand trailers')) return "retail and wholesale of pre-owned heavy-duty trailers (tautliners, flatbeds, tippers), focusing on chassis integrity, structural safety, and verified maintenance history";
    if (lower.includes('second hand trucks')) return "retail and wholesale of used heavy commercial trucks (horses and rigids), including rigorous inspection standards, mileage verification, and pre-owned dealership networks";
    if (lower.includes('trailer')) return "heavy-duty trailer components (axles, suspension, air-brakes, chassis, electrical systems, and tarpaulins)";
    if (lower.includes('engine refurbish')) return "heavy commercial diesel engine reconditioning, including cylinder head refurbishing, block machining, crankshaft grinding, and complete engine overhauls to manufacturer standards";
    if (lower.includes('engine') || lower.includes('mechanical') || lower.includes('turbo') || lower.includes('injector')) return "heavy commercial truck drivelines, internal combustion engines (diesel), gearboxes, and fuel injection systems";
    if (lower.includes('prop shaft')) return "heavy commercial vehicle drivetrain systems, specializing in prop shafts, universal joints (U-joints), center bearings, and shaft balancing";
    if (lower.includes('differential')) return "heavy-duty commercial vehicle differentials, differential gears, final drive units, and drive axle components";
    if (lower.includes('tyre') || lower.includes('tire')) return "heavy commercial vehicle tyres, retreading services, and specialized fleet wheel alignment";
    if (lower.includes('diesel') || lower.includes('oil')) return "bulk fuel supply, fleet lubricants, and high-volume commercial dispensing systems for transport operators";
    if (lower.includes('tow') || lower.includes('recovery')) return "heavy vehicle recovery, low-bed towing, and commercial breakdown services";
    return "heavy commercial fleet support, logistics-grade parts, and industrial-scale transport services";
}

function generateDiscoveryPrompt(category: string, focusHubs: string[], startSeq: number = 1) {
    const technicalFocus = getTechnicalFocus(category);

    return `ACT AS AN ELITE INDUSTRIAL FORENSIC INVESTIGATOR. 
RETURN ONLY A RAW JSON ARRAY. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION.

STRICT INSTRUCTION: DO NOT USE SYNTHETIC LANGUAGE OR CORPORATE FLUFF.
FORBIDDEN WORDS: "innovative", "solutions", "leading", "spearheading", "ecosystem", "backbone".

TASK: Discover and extract detailed verified records for exactly 100 DIFFERENT AND UNIQUE South African suppliers for: "${category}".

INVESTIGATIVE STRATEGY:
1. TARGET TECH: These suppliers MUST serve the heavy commercial transport industry (${technicalFocus}).
2. SEQUENCE: Number records from ${startSeq} to ${startSeq + 99}.
3. HUMAN IDENTITY: Find the ACTUAL NAME (First and Last) of the CEO, MD, or Owner. NO generic titles.
4. DIRECT CONTACTS: Identify the OFFICIAL CORPORATE DOMAIN (e.g. www.company.co.za). EXCLUDE aggregate registry sites (sars, gov, sayellow, linkedin).
5. MINED SERVICE SUMMARY: In the "notes" field, provide a 2-sentence summary of their SPECIFIC technical capabilities extracted from their site.
6. IDENTITY PERSISTENCE: Generate "record_id" starting with "DISC_SUPP_${category.toUpperCase().replace(/\s/g, '_')}_".

REQUIRED OUTPUT FORMAT (RAW JSON ARRAY ONLY):
[
  {
    "seq": ${startSeq},
    "record_id": "...",
    "company_name": "...",
    "industrial_category": "${category}",
    "contact_person": "ACTUAL HUMAN FULL NAME",
    "email_address": "...",
    "telephone_number": "...",
    "website": "OFFICIAL CORPORATE URL ONLY",
    "physical_address": "...",
    "notes": "TECHNICAL SUMMARY"
  }
]

HUNTING GROUNDS: Deep-search LinkedIn, local industrial hub directories, and Google for corporate domains in ${focusHubs.join(', ')}.`;
}

const DiscoveryTab = ({ category, currentCount }: { category: string, currentCount: number }) => {
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);
    const [isAutoDiscovering, setIsAutoDiscovering] = useState(false);
    const [seqOverride, setSeqOverride] = useState<number | ''>('');
    const [configError, setConfigError] = useState<string | null>(null);
    
    const startSeq = useMemo(() => (seqOverride !== '' ? Number(seqOverride) : currentCount + 1), [seqOverride, currentCount]);

    const randomHubs = useMemo(() => {
        const shuffled = [...industrialHubs].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 4);
    }, [category]);

    const prompt = generateDiscoveryPrompt(category, randomHubs, startSeq);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(prompt);
            setIsCopied(true);
            toast({ title: "Forensic Prompt Copied!", description: `Starting from sequence #${startSeq}.` });
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
                    payload: { category, type: 'supplier', startPage: Math.floor(startSeq / 100) + 1 }
                }),
            });

            const result = await response.json();
            
            if (!response.ok) {
                const errMessage = result.error || "Automation failed.";
                if (errMessage.includes('dunning') || errMessage.includes('403') || errMessage.includes('denied') || errMessage.includes('429')) {
                    setConfigError(errMessage);
                }
                throw new Error(errMessage);
            }

            toast({ title: "Discovery Successful", description: `Identified and imported ${result.count} suppliers.` });
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
                    <AlertTitle>{configError.includes('429') ? 'Rate Limit Reached' : 'Cloud API Error'}</AlertTitle>
                    <AlertDescription className="space-y-3">
                        <p className="font-mono text-[10px] bg-black/10 p-2 rounded">{configError}</p>
                        {configError.includes('429') ? (
                            <p className="text-xs">Gemini free tier allows 15 requests per minute. Please wait 60 seconds before trying the next batch.</p>
                        ) : (
                            <p className="text-xs">Ensure the Generative Language API is enabled and billing is active in your Google Cloud Project.</p>
                        )}
                        <div className="flex gap-2">
                             <Button variant="outline" size="sm" asChild className="text-destructive-foreground border-destructive/20 hover:bg-destructive/10">
                                <Link href="/docs/enable-gemini-api.md" target="_blank">AI Setup Guide</Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild className="text-destructive-foreground border-destructive/20 hover:bg-destructive/10">
                                <Link href="/docs/quota-increase-guide.md" target="_blank">Quota Limits</Link>
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
                            <Search className="h-6 w-6 text-primary" />
                            Discovery Hub: {category}
                        </h2>
                        <Badge variant="outline" className="font-mono text-sm bg-muted/30">
                            {currentCount} In Database
                        </Badge>
                    </div>
                    
                    <div className="p-4 bg-primary/5 border rounded-xl space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Sequence & Pagination Control</Label>
                            <Badge variant="outline" className="bg-white border-primary/20 text-primary text-[10px] font-black">Sync Target: #{startSeq}</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 space-y-1.5">
                                <Label className="text-xs font-bold">Start Sequence #</Label>
                                <Input 
                                    type="number" 
                                    placeholder={String(currentCount + 1)}
                                    value={seqOverride}
                                    onChange={(e) => setSeqOverride(e.target.value === '' ? '' : Number(e.target.value))}
                                    className="h-10 font-mono font-bold text-lg"
                                />
                            </div>
                             <div className="pt-6">
                                <Button variant="ghost" size="sm" className="text-[10px] uppercase font-bold" onClick={() => setSeqOverride('')}>
                                    <RefreshCcw className="mr-1 h-3 w-3" /> Auto
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                        <Button 
                            variant="default" 
                            size="lg" 
                            className="w-full gap-2 shadow-lg bg-primary hover:bg-primary/90" 
                            onClick={handleAutoDiscover} 
                            disabled={isAutoDiscovering}
                        >
                            {isAutoDiscovering ? <Loader2 className="h-5 w-5 animate-spin"/> : <Zap className="h-5 w-5" />}
                            {isAutoDiscovering ? 'Running Discovery...' : "Run AI Discovery (Batch of 100)"}
                        </Button>
                        <Button onClick={handleCopy} variant="outline" size="lg" className="w-full gap-2 shadow-sm" disabled={isAutoDiscovering}>
                            {isCopied ? <ClipboardCheck className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
                            {isCopied ? "Prompt Copied" : "Copy Manual Prompt"}
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                            <Terminal className="h-3 w-3"/> Compact Forensic Command
                        </Label>
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

export default function DiscoveryEngine() {
    const { toast } = useToast();
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Fetch CACHED counts immediately
    const { data: statsData, forceRefresh: refreshStats } = useConfig<any>('supplierDiscoveryStats');
    const counts = statsData?.counts || {};

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            await performAdminAction(token, 'refreshSupplierCategoryCounts', {});
            toast({ title: "Database Tally Complete", description: "All category counts have been updated." });
            refreshStats();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Refresh Failed", description: e.message });
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <Card className="shadow-none border-none">
            <Tabs defaultValue="Accessories" className="w-full">
                <CardHeader className="px-0 pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-6 w-6 text-primary" />
                            AI Market Discovery Engine
                        </CardTitle>
                        <CardDescription>
                            Generate forensic prompts to identify heavy commercial suppliers across 20+ industrial categories.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                         <div className="text-right mr-2 hidden md:block">
                            <p className="text-[10px] font-black uppercase text-muted-foreground">Snapshot Taken</p>
                            <p className="text-[10px] font-bold text-primary">{formatDateSafe(statsData?.lastUpdated, "dd MMM, HH:mm")}</p>
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
                    </div>
                </CardHeader>
                <CardContent className="px-0">
                    <TabsList className="h-auto flex-wrap justify-start bg-muted/30 mb-8 p-1">
                        {supplierCategories.map(category => (
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

                    {supplierCategories.map(category => (
                        <TabsContent key={category} value={category} className="mt-0">
                            <DiscoveryTab category={category} currentCount={counts[category] || 0} />
                        </TabsContent>
                    ))}
                </CardContent>
            </Tabs>
        </Card>
    );
}
