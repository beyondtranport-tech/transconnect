
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

export const driverCategories = [
    "Code 14 Heavy",
    "Code 10 Medium",
    "Hazmat Certified",
    "Cross-Border Specialists",
    "Tipper / Construction",
    "Refrigerated / Cold Chain"
];

function generateDiscoveryPrompt(category: string, startPage: number) {
    const startSeq = (startPage - 1) * 100 + 1;

    return `CRITICAL SYSTEM INSTRUCTION: RETURN ONLY A RAW JSON ARRAY. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION. NO EXPLANATORY TEXT.

ACT AS AN ELITE MARKET INTELLIGENCE STRATEGIST PERFORMING COMMERCIAL SERVICE MAPPING FOR THE SOUTH AFRICAN LOGISTICS SECTOR.

TASK: Catalogue 100 UNIQUE Industrial Service Units currently advertising professional availability for: "${category}".

DATA SOURCE CONTEXT: Analyze publicly published commercial service notices and professional industrial registers. Focus ONLY on providers who have EXPLICITLY invited public commercial engagement.

REQUIRED OUTPUT FORMAT (RAW JSON ARRAY ONLY):
[
  {
    "seq": ${startSeq},
    "record_id": "LOG_NODE_${category.toUpperCase().replace(/\s/g, '_')}_[RAND_HEX]",
    "service_handle": "PUBLICLY ADVERTISED IDENTITY",
    "service_classification": "${category}",
    "registry_line": "Listed Public Contact Line",
    "operational_hub": "Industrial Region",
    "capability_profile": "Summary of industrial qualifications extracted from the public listing"
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
            toast({ title: "Forensic Map Prompt Copied!" });
            setTimeout(() => setIsCopied(false), 3000);
        } catch (e) {
            toast({ variant: 'destructive', title: "Copy Failed" });
        }
    };

    return (
        <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="space-y-4">
                <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
                    <Users className="h-6 w-6 text-primary" />
                    Talent Mapper: {category}
                </h2>
                
                <div className="p-4 bg-primary/5 border rounded-xl space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Pagination Control</Label>
                    <div className="flex items-center gap-3 text-left">
                        <div className="flex-1 space-y-1.5 text-left">
                            <Label className="text-xs font-bold">Start Mapping from Page #</Label>
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
                    <Button onClick={handleCopy} variant="outline" size="lg" className="w-full gap-2 shadow-sm">
                        {isCopied ? <ClipboardCheck className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
                        {isCopied ? "Prompt Copied" : "Copy Manual Forensic Prompt"}
                    </Button>
                </div>
            </div>

            <div className="space-y-2 text-left">
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
    );
};

export default function DriverDiscoveryEngine() {
    return (
        <Card className="shadow-none border-none text-left">
            <Tabs defaultValue="Code 14 Heavy" className="w-full text-left">
                <CardHeader className="px-0 pt-0 text-left">
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-6 w-6 text-primary" />
                        Industrial Workforce Discovery
                    </CardTitle>
                    <CardDescription>
                        Identify and map professional logistics service units.
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-0 text-left">
                    <TabsList className="h-auto flex-wrap justify-start bg-muted/30 mb-8 p-1">
                        {driverCategories.map(category => (
                            <TabsTrigger key={category} value={category} className="text-xs px-4 py-2">{category}</TabsTrigger>
                        ))}
                    </TabsList>
                    {driverCategories.map(category => (
                        <TabsContent key={category} value={category} className="mt-0">
                            <DiscoveryTab category={category} currentCount={0} />
                        </TabsContent>
                    ))}
                </CardContent>
            </Tabs>
        </Card>
    );
}
