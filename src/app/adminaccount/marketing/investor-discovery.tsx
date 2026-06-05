
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Sparkles, Copy, ClipboardCheck, Info, Search, Terminal, MapPin, ListOrdered, Loader2, DollarSign } from "lucide-react";
import * as React from "react";
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

const investorCategories = [
    "VC Funds",
    "Angel Networks",
    "Seed Funds",
    "Family Offices",
    "Institutional"
];

function generateInvestorPrompt(category: string) {
    return `CRITICAL SYSTEM INSTRUCTION: RETURN ONLY A RAW JSON ARRAY. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION.

ACT AS AN ELITE VENTURE INTELLIGENCE AGENT. 

TASK: Discover and extract detailed verified records for exactly 50 unique entities in the category: "${category}".

FOCUS: Private capital providers interested in B2B SaaS, Logistics Technology, Fintech, or African Startups.

INVESTIGATIVE STRATEGY:
1. HUMAN IDENTITY: You MUST find the ACTUAL NAME (First and Last) of a Partner, Managing Director, or Investment Lead. 
2. FORBIDDEN VALUES: Returning "The Partner", "Investment Manager", or "Unknown" is a failure. Search LinkedIn for specific human names.
3. PROACTIVE CONTACT SEARCH: Identify official website and professional contact info.

REQUIRED OUTPUT FORMAT (RAW JSON ARRAY ONLY):
[
  {
    "company_name": "...",
    "industrial_category": "${category}",
    "contact_person": "ACTUAL HUMAN FULL NAME",
    "email_address": "...",
    "telephone_number": "...",
    "website": "...",
    "physical_address": "..."
  }
]

HUNTING GROUNDS: Search LinkedIn, Crunchbase, and African Startup Registries.`;
}

const DiscoveryTab = ({ category }: { category: string }) => {
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);
    
    const prompt = generateInvestorPrompt(category);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(prompt);
            setIsCopied(true);
            toast({ title: "Investor Prompt Copied!", description: `Paste into Gemini 1.5 Pro to find ${category}.` });
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
                        <DollarSign className="h-6 w-6 text-primary" />
                        App Launch Discovery: {category}
                    </h2>
                    
                    <Alert className="bg-primary/5 border-primary/20">
                        <Info className="h-4 w-4 text-primary" />
                        <AlertTitle>Startup Growth Strategy</AlertTitle>
                        <AlertDescription className="text-xs">
                            This engine targets capital for the <strong>Logistics Flow</strong> platform itself. These are not industrial lenders, but potential equity partners for your launch.
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
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <Terminal className="h-3 w-3"/> Intelligence Command
                    </Label>
                    <ScrollArea className="h-[300px] border rounded-lg bg-slate-900 p-4 shadow-inner">
                        <pre className="text-[10px] text-slate-300 font-mono whitespace-pre-wrap leading-tight">
                            {prompt}
                        </pre>
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
};

export default function InvestorDiscoveryEngine() {
    return (
        <Card className="shadow-none border-none">
            <Tabs defaultValue="VC Funds" className="w-full">
                <CardHeader className="px-0 pt-0">
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-primary" />
                        App Launch Investor Discovery
                    </CardTitle>
                    <CardDescription>
                        Generate tailored prompts to discover equity partners, VCs, and angel investors for the platform launch.
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                    <TabsList className="h-auto flex-wrap justify-start bg-muted/30 mb-8">
                        {investorCategories.map(category => (
                            <TabsTrigger key={category} value={category} className="text-xs px-4 py-2">
                                {category}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {investorCategories.map(category => (
                        <TabsContent key={category} value={category} className="mt-0">
                            <DiscoveryTab category={category} />
                        </TabsContent>
                    ))}
                </CardContent>
            </Tabs>
        </Card>
    );
}
