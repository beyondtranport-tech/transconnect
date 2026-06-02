
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowRight, PlusCircle, Sparkles, Copy, ClipboardCheck, Info, Search, Terminal, SearchCode, MapPin, ListOrdered } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useState, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const supplierCategories = [
    "Accessories", 
    "Anti-Theft Devices", 
    "Auto Electrical", 
    "Batteries", 
    "Brakes", 
    "Cleaning Products",
    "Diesel", 
    "Filters", 
    "Injectors", 
    "Lights", 
    "Mechanical repairs",
    "Oils & Lubricants", 
    "Parts", 
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
    // GAUTENG (Central & N1 Corridor)
    "Isando (GP)", "Jet Park (GP)", "Spartan (GP)", "Aeroton (GP)", "City Deep (GP)", "Alrode (GP)", "Wadeville (GP)", "Midrand (GP)", "Sunderland Ridge (GP)", "Rosslyn (GP)", "Silverton (GP)", "Roodekop (GP)", "Clayville (GP)", "Vanderbijlpark (GP)", "Vereeniging (GP)", "Heidelberg (GP - N3)",
    
    // WESTERN CAPE (N1/N2 Corridors)
    "Epping (WC)", "Montague Gardens (WC)", "Paarden Eiland (WC)", "Stikland (WC)", "Blackheath (WC)", "Airport Industria (WC)", "Killarney Gardens (WC)", "Saldanha (WC)", "George (WC - N2)", "Mossel Bay (WC - N2)", "Worcester (WC - N1)", "Beaufort West (WC - N1)", "Paarl (WC - N1)",
    
    // KWAZULU-NATAL (N2 & Central)
    "Pinetown (KZN)", "Westmead (KZN)", "Mobeni (KZN)", "Prospecton (KZN)", "Richards Bay (KZN - N2)", "New Germany (KZN)", "Phoenix Industrial (KZN)", "Port Shepstone (KZN - N2)", "Empangeni (KZN)", "Mandeni (KZN)", "Newcastle (KZN)", "Ladysmith (KZN)", "Pietermaritzburg (KZN)",
    
    // FREE STATE (N1 Corridor)
    "Bloemfontein (FS - N1)", "Kroonstad (FS - N1)", "Sasolburg (FS - N1)", "Harrismith (FS - N3)", "Welkom (FS)",
    
    // EASTERN CAPE (N2 Corridor)
    "Struandale (EC)", "Deal Party (EC)", "Markman (EC)", "East London (EC - N2)", "Mthatha (EC - N2)", "Gqeberha (EC - N2)", "Uitenhage (EC)",
    
    // NORTHERN SOUTH AFRICA (Limpopo, North West, Mpumalanga)
    "Polokwane (LP - N1)", "Musina (LP - N1)", "Louis Trichardt (LP - N1)", "Mokopane (LP - N1)", "Lephalale (LP)", "Thohoyandou (LP)",
    "Witbank/Emalahleni (MP - N4)", "Middelburg (MP - N11)", "Nelspruit/Mbombela (MP - N4)", "Secunda (MP)", "Ermelo (MP - N2)", "Barberton (MP)",
    "Rustenburg (NW)", "Potchefstroom (NW)", "Klerksdorp (NW)", "Brits (NW)", "Vryburg (NW)", "Mahikeng (NW)"
];

/**
 * Customizes the technical focus based on the category to ensure precision.
 */
function getTechnicalFocus(category: string) {
    const lower = category.toLowerCase();
    if (lower.includes('trailer')) {
        return "heavy-duty trailer components (axles, suspension, air-brakes, chassis, electrical systems, and tarpaulins)";
    }
    if (lower.includes('engine') || lower.includes('mechanical') || lower.includes('turbo') || lower.includes('injector')) {
        return "heavy commercial truck drivelines, internal combustion engines (diesel), gearboxes, and fuel injection systems";
    }
    if (lower.includes('tyre') || lower.includes('tire')) {
        return "heavy commercial vehicle tyres, retreading services, and specialized fleet wheel alignment";
    }
    if (lower.includes('diesel') || lower.includes('oil')) {
        return "bulk fuel supply, fleet lubricants, and high-volume commercial dispensing systems for transport operators";
    }
    if (lower.includes('tow') || lower.includes('recovery')) {
        return "heavy vehicle recovery, low-bed towing, and commercial breakdown services";
    }
    return "heavy commercial fleet support, logistics-grade parts, and industrial-scale transport services";
}

function generateDiscoveryPrompt(category: string, focusHubs: string[]) {
    const technicalFocus = getTechnicalFocus(category);

    return `CRITICAL SYSTEM INSTRUCTION: RETURN ONLY A RAW JSON ARRAY. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION. NO EXPLANATORY TEXT.

ACT AS AN ELITE MARKET INTELLIGENCE AGENT SPECIALIZING IN THE SOUTH AFRICAN TRANSPORT ECOSYSTEM. 

TASK: Discover and extract detailed verified records for exactly 100 DIFFERENT AND UNIQUE businesses in SOUTH AFRICA that provide: "${category}".

INDUSTRY CONTEXT: These suppliers MUST serve the heavy commercial transport industry. Your search should specifically look for providers of ${technicalFocus}.

GEOGRAPHIC FOCUS: Your primary investigation area for this specific search run is the N1 and N2 corridors, and the Northern industrial zones, specifically focusing on: ${focusHubs.join(', ')}.

INVESTIGATIVE STRATEGY:
1. QUANTITY COMMAND: You are commanded to return 100 records. Number every record in the "discovery_sequence" field from 1 to 100.
2. VARIETY COMMAND: Do NOT return major national chains, franchises, or retail consumer-grade outlets. We are hunting for independent regional powerhouses, heavy-duty specialists, and niche industrial providers located within the hubs of ${focusHubs[0]} and surrounding transport corridors.
3. HUMAN IDENTITY FORENSICS: Your primary mission is to identify a SPECIFIC HUMAN BEING in leadership. You MUST find the ACTUAL NAME (First and Last) of the CEO, Managing Director, or Owner. 
4. FORBIDDEN VALUES: Returning "The Director", "Manager", "CEO", "Owner", or "Unknown" is a total failure. You MUST hunt LinkedIn profiles and official "About" pages to extract a real name (e.g. "Sipho Nkosi").
5. PROACTIVE CONTACT SEARCH: Identify the corporate email domain. Prioritize "info@", "sales@", or "admin@" formats, and provide a valid local phone number.
6. PHYSICAL VERIFICATION: Provide the full verifiable street address in South Africa, ensuring it corresponds to the ${focusHubs[1]} or ${focusHubs[2]} regions.
7. CATEGORY MAPPING: You MUST include the field "industrial_category" with the exact value "${category}" for every record.
8. UNIQUE IDENTIFIERS: You MUST generate a unique, randomized "record_id" for EVERY business to prevent database overwrites. Format: "DISCOVERY_${category.toUpperCase().replace(/\s/g, '_')}_[RANDOM_5_CHAR_ALPHANUMERIC]".

REQUIRED OUTPUT FORMAT (RAW JSON ARRAY ONLY):
[
  {
    "discovery_sequence": 1,
    "record_id": "DISCOVERY_${category.toUpperCase().replace(/\s/g, '_')}_XJ92K",
    "company_name": "Exact Registered Name",
    "industrial_category": "${category}",
    "contact_person": "ACTUAL HUMAN FULL NAME (MANDATORY)",
    "email_address": "Verified Email",
    "telephone_number": "Phone Number",
    "website": "URL",
    "physical_address": "Full Street Address, Suburb, City, Province"
  }
]

HUNTING GROUNDS: Search LinkedIn Business Pages, Yellow Pages South Africa, Brabys, and local industrial zone registries along the N1/N2 motorways and Northern South Africa hubs.`;
}

const DiscoveryTab = ({ category }: { category: string }) => {
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
            toast({ title: "Forensic Prompt Copied!", description: `Focused on N1/N2 corridors & ${randomHubs[0]}. Paste into AI Studio.` });
            setTimeout(() => setIsCopied(false), 3000);
        } catch (e) {
            toast({ variant: 'destructive', title: "Copy Failed" });
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
                        <Search className="h-6 w-6 text-primary" />
                        Discovery Hub: {category}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                        Forensic-tuned prompt to find independent <strong>transport-focused</strong> specialists along the N1/N2 corridors and the North.
                    </p>
                    
                    <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-primary shrink-0" />
                        <div className="text-xs">
                            <span className="font-bold text-primary uppercase">Geographic Rotation (Includes N1/N2):</span>
                            <p className="font-semibold text-foreground mt-0.5">{randomHubs.join(' • ')}</p>
                        </div>
                    </div>

                    <Alert className="bg-amber-50 border-amber-200">
                        <Info className="h-4 w-4 text-amber-600" />
                        <AlertTitle className="font-bold">Handling Output Truncation</AlertTitle>
                        <AlertDescription className="text-xs space-y-2">
                            <p>Large batches (100 records) often exceed LLM output limits. We have added <strong>sequence numbering</strong> to the prompt.</p>
                            <p><strong>If the AI stops early:</strong> Simply type <code className="bg-amber-100 px-1 py-0.5 rounded font-bold">"continue from [last number] to 100"</code> in the AI Studio chat to get the remaining records.</p>
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
                            <Terminal className="h-3 w-3"/> AI Forensic Command (100 Records)
                        </Label>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/20">
                                <ListOrdered className="h-3 w-3 mr-1"/> Sequence Active
                            </Badge>
                            <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/20">{category}</Badge>
                        </div>
                    </div>
                    <ScrollArea className="h-[320px] border rounded-lg bg-slate-900 p-4 shadow-inner">
                        <pre className="text-[11px] text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                            {prompt}
                        </pre>
                    </ScrollArea>
                </div>
            </div>

            <div className="bg-muted/30 p-6 rounded-xl text-center border space-y-4">
                 <h3 className="text-lg font-bold">Import Extracted Leads</h3>
                 <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                    Once the AI returns your complete JSON list, head to the Supplier Management tab to import them into your permanent registry.
                 </p>
                 <Button asChild variant="secondary" className="shadow-sm">
                    <Link href="/adminaccount?view=marketing-suppliers&subview=management">
                        Open Supplier Registry <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                 </Button>
            </div>
        </div>
    );
};

export default function DiscoveryEngine() {
    return (
        <Card className="shadow-none border-none">
            <Tabs defaultValue="Accessories" className="w-full">
                <CardHeader className="px-0 pt-0">
                    <CardTitle className="flex items-center gap-2">
                        <SearchCode className="h-6 w-6 text-primary" />
                        AI Market Discovery Engine
                    </CardTitle>
                    <CardDescription>
                        Generate tailored intelligence prompts with <strong>Sequence Numbering</strong> and <strong>N1/N2 Corridors Rotation</strong> to discover unique heavy commercial suppliers.
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                    <TabsList className="h-auto flex-wrap justify-start bg-muted/30 mb-8 p-1">
                        {supplierCategories.map(category => (
                            <TabsTrigger key={category} value={category} className="text-xs px-4 py-2">{category}</TabsTrigger>
                        ))}
                    </TabsList>

                    {supplierCategories.map(category => (
                        <TabsContent key={category} value={category} className="mt-0">
                            <DiscoveryTab category={category} />
                        </TabsContent>
                    ))}
                </CardContent>
            </Tabs>
        </Card>
    );
}
