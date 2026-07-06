'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, ClipboardCheck, Terminal, Database, ShieldCheck, ShoppingCart, Info, UserCheck, Zap, Target } from "lucide-react";
import * as React from "react";
import { useState, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const buySellCategories = [
    "Truck Dealership",
    "Trailer Manufacturer",
    "Equipment Auctioneer",
    "Asset Refurbisher",
    "Fleet Salvage Yard",
    "Commercial Body Builder"
];

function generateDiscoveryPrompt(category: string, startSeq: number = 1) {
    return `ACT AS AN ELITE ASSET TRADING INVESTIGATOR AND FORENSIC SCOUT. 
RETURN ONLY A RAW JSON ARRAY. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION.

CRITICAL INTEGRITY SHIELD: 
DO NOT RETURN MOCK DATA. 
YOU MUST PERFORM A LIVE SEARCH FOR "${category} companies in South Africa" on Google, Facebook Marketplace, and automotive directories.
VERIFY THE DEALER HAS ACTIVE LISTINGS.

TASK: Discover and extract exactly 30 UNIQUE, LIVE South African asset providers for: "${category}".

FORENSIC PROTOCOL:
1. INVENTORY SCAN: Identify the primary brands handled (e.g. Scania, Volvo, Afrit, Henred).
2. DEPOT VERIFICATION: Map the primary showroom or yard location.
3. HUMAN IDENTITY: Find the ACTUAL FULL NAME of the Sales Lead, MD, or Owner.
4. CONTACT MAPPING: Identify professional email and direct mobile numbers (+27 format).
5. RECORD KEY: Generate a unique "record_id" starting with "DISC_ASSET_${category.toUpperCase().replace(/\s/g, '_')}_".

REQUIRED JSON FIELDS:
[
  {
    "seq": ${startSeq},
    "record_id": "...",
    "companyName": "DEALERSHIP / MAKER NAME",
    "industrial_category": "${category}",
    "contact_person": "VERIFIED HUMAN NAME",
    "email": "...",
    "mobile": "...",
    "website": "OFFICIAL INVENTORY URL",
    "address": "PHYSICAL SHOWROOM ADDRESS",
    "notes": "Summary of typical stock, brands supported, and trade-in capabilities."
  }
]`;
}

const DiscoveryTab = ({ category, currentCount }: { category: string, currentCount: number }) => {
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);
    const [seqOverride, setSeqOverride] = useState<number | ''>('');
    
    const startSeq = useMemo(() => (seqOverride !== '' ? Number(seqOverride) : currentCount + 1), [seqOverride, currentCount]);
    const prompt = generateDiscoveryPrompt(category, startSeq);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(prompt);
        setIsCopied(true);
        toast({ title: "Forensic Prompt Ready", description: "Targeted at commercial asset trading." });
        setTimeout(() => setIsCopied(false), 3000);
    };

    return (
        <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="space-y-4 text-left text-foreground">
                <h2 className="text-2xl font-bold font-headline flex items-center gap-2 text-foreground text-left">
                    <ShoppingCart className="h-6 w-6 text-primary" />
                    Asset Dealer Scouting: {category}
                </h2>

                <Alert className="bg-primary/5 border-primary/20 text-left">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <AlertTitle className="font-bold text-left text-foreground">Buy & Sell Mall Mapping</AlertTitle>
                    <AlertDescription className="text-xs text-left text-muted-foreground">
                        Scouting for commercial dealers who can list new and used vehicles in the Mall. Focus on entities with verified physical yards.
                    </AlertDescription>
                </Alert>

                <div className="p-4 bg-muted/30 border rounded-xl space-y-4 text-left">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 text-left">Sequence Sync</Label>
                    <div className="space-y-1.5 text-left text-foreground">
                        <Label className="text-xs font-bold text-foreground text-left">Start Sequence #</Label>
                        <Input 
                            type="number" 
                            value={seqOverride}
                            onChange={(e) => setSeqOverride(e.target.value === '' ? '' : Number(e.target.value))}
                            className="h-10 font-mono bg-white"
                        />
                    </div>
                </div>
                <Button onClick={handleCopy} size="lg" className="w-full gap-2 h-14 font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-white">
                    {isCopied ? <ClipboardCheck className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    Copy Discovery Prompt
                </Button>
            </div>
            <div className="space-y-2 text-left text-foreground text-foreground">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 text-left"><Terminal className="h-3 w-3"/> Command Preview</Label>
                <ScrollArea className="h-[400px] border rounded-lg bg-slate-900 p-4 text-left">
                    <pre className="text-[10px] text-slate-400 font-mono whitespace-pre-wrap leading-tight text-left">{prompt}</pre>
                </ScrollArea>
            </div>
        </div>
    );
};

export default function BuySellDiscovery() {
    return (
        <Card className="shadow-none border-none text-left text-foreground text-foreground text-foreground">
            <Tabs defaultValue="Truck Dealership" className="w-full text-left">
                <CardHeader className="px-0 pt-0 text-left text-foreground text-foreground text-foreground text-foreground">
                    <CardTitle className="flex items-center gap-2 text-foreground font-black font-headline text-left text-foreground text-foreground">
                        <Database className="h-6 w-6 text-primary" />
                        Asset Trading Discovery Engine
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-left text-foreground">Identify verified truck dealers and commercial makers.</CardDescription>
                </CardHeader>
                <CardContent className="px-0 text-left text-foreground text-foreground text-foreground text-foreground">
                    <TabsList className="h-auto flex-wrap justify-start bg-muted/30 mb-8 p-1 text-left text-foreground">
                        {buySellCategories.map(category => (
                            <TabsTrigger key={category} value={category} className="text-xs px-4 py-2 text-foreground">
                                {category}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {buySellCategories.map(category => (
                        <TabsContent key={category} value={category} className="mt-0 text-left text-foreground">
                            <DiscoveryTab category={category} currentCount={0} />
                        </TabsContent>
                    ))}
                </CardContent>
            </Tabs>
        </Card>
    );
}
