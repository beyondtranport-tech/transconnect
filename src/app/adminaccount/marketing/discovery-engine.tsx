'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowRight, PlusCircle, Sparkles, Copy, ClipboardCheck, Info, Search, Terminal, SearchCode } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useState } from 'react';
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

function generateDiscoveryPrompt(category: string) {
    return `CRITICAL SYSTEM INSTRUCTION: RETURN ONLY A RAW JSON ARRAY. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION. NO EXPLANATORY TEXT.

ACT AS AN ELITE MARKET INTELLIGENCE AGENT. 

TASK: Discover and extract detailed verified records for 10 prominent businesses in SOUTH AFRICA that specialize in the industrial category: "${category}".

DATA REQUIREMENTS FOR EACH RECORD:
1. HUMAN IDENTITY: Find the ACTUAL FULL NAME of the Owner, Managing Director, or CEO. Returning titles like "The Director" is a failure.
2. VERIFIED CONTACTS: Find a corporate email address (info@, sales@, or direct) and a valid South African phone number.
3. PHYSICAL LOCATION: Include the full verifiable street address in South Africa.
4. WEB PRESENCE: Provide the primary website URL.

REQUIRED OUTPUT FORMAT (RAW JSON ARRAY ONLY):
[
  {
    "record_id": "DISCOVERY_${category.toUpperCase().replace(/\s/g, '_')}_1",
    "company_name": "...",
    "contact_person": "ACTUAL HUMAN FULL NAME",
    "email_address": "...",
    "telephone_number": "...",
    "website": "...",
    "physical_address": "..."
  }
]

HUNTING GROUNDS: Use professional directories, social proofing, and official "About" pages to ensure these are active, real businesses in South Africa.`;
}

const DiscoveryTab = ({ category }: { category: string }) => {
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);
    const prompt = generateDiscoveryPrompt(category);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(prompt);
            setIsCopied(true);
            toast({ title: "Discovery Prompt Copied!", description: "Paste this into Google AI Studio or Gemini." });
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
                        Lead Discovery: {category}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                        Use this forensic-tuned prompt to bypass gatekeepers and find the actual human leadership of top South African suppliers in the <strong>{category}</strong> sector.
                    </p>
                    
                    <Alert className="bg-primary/5 border-primary/20">
                        <Info className="h-4 w-4 text-primary" />
                        <AlertTitle>Discovery Workflow</AlertTitle>
                        <AlertDescription className="text-xs space-y-2">
                            <p>1. Copy the tailored prompt below.</p>
                            <p>2. Paste into <strong>Google AI Studio</strong>.</p>
                            <p>3. Use the <strong>Bulk Import</strong> tool in the Supplier Database to add the results.</p>
                        </AlertDescription>
                    </Alert>

                    <div className="pt-4 flex flex-col gap-2">
                        <Button onClick={handleCopy} size="lg" className="w-full gap-2">
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
                            <Terminal className="h-3 w-3"/> AI Discovery Command
                        </Label>
                        <Badge variant="outline" className="text-[10px] uppercase">{category}</Badge>
                    </div>
                    <ScrollArea className="h-[300px] border rounded-lg bg-slate-900 p-4 shadow-inner">
                        <pre className="text-[11px] text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                            {prompt}
                        </pre>
                    </ScrollArea>
                </div>
            </div>

            <div className="bg-muted/30 p-6 rounded-xl text-center space-y-4">
                 <h3 className="text-lg font-bold">Import Discovered Leads</h3>
                 <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                    Once the AI returns your list of {category} suppliers, head to the database to import them.
                 </p>
                 <Button asChild variant="secondary">
                    <Link href="/adminaccount?view=marketing-suppliers&subview=management">
                        Go to Supplier Database <ArrowRight className="ml-2 h-4 w-4" />
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
                        AI Discovery Engine
                    </CardTitle>
                    <CardDescription>
                        Generate tailored market intelligence prompts for discovery.
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