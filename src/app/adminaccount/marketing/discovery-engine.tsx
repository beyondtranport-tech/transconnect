
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Copy, ClipboardCheck, Info, Search, Terminal, Loader2, RefreshCcw, Database, Zap, AlertTriangle } from "lucide-react";
import * as React from "react";
import { useState, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getClientSideAuthToken } from '@/firebase';
import { useConfig } from '@/hooks/use-config';
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
    "Isando (GP)", "Jet Park (GP)", "Spartan (GP)", "Aeroton (GP)", "City Deep (GP)", "Alrode (GP)", "Wadeville (GP)", "Midrand (GP)", "Rosslyn (GP)", "Epping (WC)", "Montague Gardens (WC)", "Pinetown (KZN)", "Westmead (KZN)"
];

function getTechnicalFocus(category: string) {
    const lower = category.toLowerCase();
    if (lower === 'air') return "heavy commercial vehicle air systems, compressors, and valves";
    if (lower.includes('trailer')) return "heavy-duty trailer components (axles, suspension, chassis)";
    if (lower.includes('engine')) return "heavy commercial diesel engine reconditioning and machining";
    return "heavy commercial fleet support and industrial-scale transport services";
}

function generateDiscoveryPrompt(category: string, focusHubs: string[], startSeq: number = 1) {
    const technicalFocus = getTechnicalFocus(category);

    return `ACT AS AN ELITE INDUSTRIAL FORENSIC INVESTIGATOR. 
RETURN ONLY A RAW JSON ARRAY. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION. NO EXPLANATORY TEXT.

STRICT INSTRUCTION: DO NOT USE SYNTHETIC LANGUAGE OR CORPORATE FLUFF.
FORBIDDEN WORDS: "innovative", "solutions", "leading", "spearheading", "ecosystem", "backbone".

TASK: Discover 100 UNIQUE South African suppliers for: "${category}".

INVESTIGATIVE STRATEGY:
1. TARGET TECH: Must serve heavy commercial transport (${technicalFocus}).
2. HUMAN IDENTITY: Find ACTUAL NAME of CEO/MD/Owner.
3. DIRECT CONTACTS: Identify OFFICIAL CORPORATE DOMAIN (e.g. www.company.co.za).
4. MINED SERVICE SUMMARY: 2-sentence summary of SPECIFIC technical capabilities.
5. IDENTITY PERSISTENCE: Generate "record_id" starting with "DISC_SUPP_${category.toUpperCase().replace(/\s/g, '_')}_".

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
]`;
}

const DiscoveryTab = ({ category, currentCount }: { category: string, currentCount: number }) => {
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);
    const [isAutoDiscovering, setIsAutoDiscovering] = useState(false);
    const [seqOverride, setSeqOverride] = useState<number | ''>('');
    const [configError, setConfigError] = useState<string | null>(null);
    
    const startSeq = useMemo(() => (seqOverride !== '' ? Number(seqOverride) : currentCount + 1), [seqOverride, currentCount]);
    const prompt = generateDiscoveryPrompt(category, industrialHubs.slice(0, 4), startSeq);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(prompt);
            setIsCopied(true);
            toast({ title: "Forensic Prompt Copied!" });
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
            if (!response.ok) throw new Error(result.error || "Automation failed.");
            toast({ title: "Discovery Successful", description: `Imported ${result.count} suppliers.` });
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Discovery Error", description: e.message });
        } finally {
            setIsAutoDiscovering(false);
        }
    };

    return (
        <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4 text-left">
                <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
                    <Search className="h-6 w-6 text-primary" />
                    Discovery Hub: {category}
                </h2>
                <div className="p-4 bg-primary/5 border rounded-xl space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Sequence Control</Label>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 space-y-1.5">
                            <Label className="text-xs font-bold">Start Sequence #</Label>
                            <Input 
                                type="number" 
                                value={seqOverride}
                                onChange={(e) => setSeqOverride(e.target.value === '' ? '' : Number(e.target.value))}
                                className="h-10 font-mono"
                            />
                        </div>
                    </div>
                </div>
                <div className="pt-2 flex flex-col gap-2">
                    <Button onClick={handleAutoDiscover} disabled={isAutoDiscovering} className="w-full gap-2">
                        {isAutoDiscovering ? <Loader2 className="h-5 w-5 animate-spin"/> : <Zap className="h-5 w-5" />}
                        Run AI Discovery (Batch of 100)
                    </Button>
                    <Button onClick={handleCopy} variant="outline" className="w-full gap-2">
                        {isCopied ? <ClipboardCheck className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                        Copy Forensic Prompt
                    </Button>
                </div>
            </div>
            <div className="space-y-2 text-left">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prompt Preview</Label>
                <ScrollArea className="h-[400px] border rounded-lg bg-slate-900 p-4">
                    <pre className="text-[10px] text-slate-400 font-mono whitespace-pre-wrap">{prompt}</pre>
                </ScrollArea>
            </div>
        </div>
    );
};

export default function DiscoveryEngine() {
    return (
        <Card className="shadow-none border-none">
            <Tabs defaultValue="Accessories" className="w-full">
                <CardHeader className="px-0 pt-0 text-left">
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-6 w-6 text-primary" />
                        AI Market Discovery
                    </CardTitle>
                    <CardDescription>Target unique industrial entities across South Africa.</CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                    <TabsList className="h-auto flex-wrap justify-start bg-muted/30 mb-8 p-1">
                        {supplierCategories.map(category => (
                            <TabsTrigger key={category} value={category} className="text-xs px-4 py-2">{category}</TabsTrigger>
                        ))}
                    </TabsList>
                    {supplierCategories.map(category => (
                        <TabsContent key={category} value={category}>
                            <DiscoveryTab category={category} currentCount={0} />
                        </TabsContent>
                    ))}
                </CardContent>
            </Tabs>
        </Card>
    );
}
