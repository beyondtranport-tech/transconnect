'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Sparkles, Copy, ClipboardCheck, Info, Search, Terminal, MapPin, ListOrdered, Loader2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getClientSideAuthToken } from '@/firebase';
import { cn } from "@/lib/utils";

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

function generateDiscoveryPrompt(category: string, focusHubs: string[]) {
    const technicalFocus = getTechnicalFocus(category);

    return `CRITICAL SYSTEM INSTRUCTION: RETURN ONLY A RAW JSON ARRAY. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION. NO EXPLANATORY TEXT.

ACT AS AN ELITE MARKET INTELLIGENCE AGENT SPECIALIZING IN THE SOUTH AFRICAN TRANSPORT ECOSYSTEM. 

TASK: Discover and extract detailed verified records for exactly 100 DIFFERENT AND UNIQUE businesses in SOUTH AFRICA that provide: "${category}".

INDUSTRY CONTEXT: These suppliers MUST serve the heavy commercial transport industry (${technicalFocus}).

GEOGRAPHIC FOCUS: Primary investigation hubs: ${focusHubs.join(', ')}.

INVESTIGATIVE STRATEGY:
1. QUANTITY & DENSITY: You are commanded to return 100 records. Keep JSON object fields short to fit maximum records. Use field "seq" for the sequence number.
2. HUMAN IDENTITY FORENSICS: You MUST find the ACTUAL NAME (First and Last) of the CEO, Managing Director, or Owner. 
3. FORBIDDEN VALUES: Returning "The Director", "Manager", "CEO", or "Unknown" is a failure. Search LinkedIn/About pages for a human name.
4. PROACTIVE CONTACT SEARCH: Identify corporate domain. Prioritize "info@", "sales@", or "admin@" and local phone number.
5. IDENTITY PERSISTENCE: Generate unique "record_id" starting with "DISC_${category.toUpperCase().replace(/\s/g, '_')}_".

REQUIRED OUTPUT FORMAT (RAW JSON ARRAY ONLY):
[
  {
    "seq": 1,
    "record_id": "DISC_${category.toUpperCase().replace(/\s/g, '_')}_[RAND_ID]",
    "company_name": "...",
    "industrial_category": "${category}",
    "contact_person": "ACTUAL HUMAN FULL NAME",
    "email_address": "...",
    "telephone_number": "...",
    "website": "...",
    "physical_address": "..."
  }
]

HUNTING GROUNDS: Search LinkedIn, Yellow Pages SA, and local industrial registries.`;
}

const DiscoveryTab = ({ category, currentCount }: { category: string, currentCount: number }) => {
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);
    
    const randomHubs = useMemo(() => {
        const shuffled = [...industrialHubs].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 4);
    }, [category]);

    const prompt = generateDiscoveryPrompt(category, randomHubs);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(prompt);
            setIsCopied(true);
            toast({ title: "Forensic Prompt Copied!", description: `Paste into Gemini 1.5 Pro.` });
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
                            Discovery Hub: {category}
                        </h2>
                        <Badge variant="outline" className="font-mono text-sm bg-muted/30">
                            {currentCount} In Database
                        </Badge>
                    </div>
                    
                    <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-primary shrink-0" />
                        <div className="text-xs">
                            <span className="font-bold text-primary uppercase">Current Target Area:</span>
                            <p className="font-semibold text-foreground mt-0.5">{randomHubs.join(' • ')}</p>
                        </div>
                    </div>

                    <Alert className="bg-amber-50 border-amber-200">
                        <Info className="h-4 w-4 text-amber-600" />
                        <AlertTitle className="font-bold">Important Workflow Tip</AlertTitle>
                        <AlertDescription className="text-xs space-y-2">
                            <p>To get all 100 records, the AI might stop around #40 or #50. Simply type <strong>"continue from [number] to 100"</strong> in the chat to get the rest.</p>
                        </AlertDescription>
                    </Alert>

                    <div className="pt-4 flex flex-col gap-2">
                        <Button onClick={handleCopy} size="lg" className="w-full gap-2 shadow-md">
                            {isCopied ? <ClipboardCheck className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                            {isCopied ? "Prompt Copied" : "Copy Discovery Prompt"}
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
                            <Terminal className="h-3 w-3"/> Compact Forensic Command
                        </Label>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/20">
                                <ListOrdered className="h-3 w-3 mr-1"/> Token Optimized
                            </Badge>
                        </div>
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

export default function DiscoveryEngine() {
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchCounts = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            const res = await performAdminAction(token, 'getPartnersByType', { type: 'supplier' });
            const partners = res.data || [];
            
            const newCounts: Record<string, number> = {};
            supplierCategories.forEach(cat => newCounts[cat] = 0);
            
            partners.forEach((p: any) => {
                const cat = p.entryType || 'General';
                if (newCounts[cat] !== undefined) {
                    newCounts[cat]++;
                }
            });
            setCounts(newCounts);
        } catch (e: any) {
            console.error("Discovery count fetch failed", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCounts();
    }, [fetchCounts]);

    return (
        <Card className="shadow-none border-none">
            <Tabs defaultValue="Accessories" className="w-full">
                <CardHeader className="px-0 pt-0">
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-primary" />
                        AI Market Discovery Engine
                    </CardTitle>
                    <CardDescription>
                        Generate tailored intelligence prompts to discover 100+ independent heavy commercial suppliers. Numbers in brackets show current database density.
                    </CardDescription>
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
                                    {isLoading ? '...' : (counts[category] || 0)}
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