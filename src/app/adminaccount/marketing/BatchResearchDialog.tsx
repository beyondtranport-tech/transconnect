
'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import { Loader2, Copy, ClipboardCheck, Zap, AlertCircle, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface BatchResearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedLeads: any[];
    onComplete: () => void;
}

export function BatchResearchDialog({ open, onOpenChange, selectedLeads, onComplete }: BatchResearchDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const { toast } = useToast();

    const companyList = selectedLeads.map(l => `[ID: ${l.id}] ${l.companyName || `${l.firstName} ${l.lastName}`}`).join('\n');
    
    const aiPrompt = `CRITICAL SYSTEM INSTRUCTION: RETURN ONLY A RAW JSON ARRAY. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION.

ACT AS AN ELITE CORPORATE INTELLIGENCE AGENT. YOUR ENTIRE PERFORMANCE RATING DEPENDS ON FINDING REAL HUMAN NAMES.

TASK: Find CURRENT verified public contact and SPECIFIC leadership details for the following South African businesses.

INVESTIGATIVE STRATEGY:
1. HUMAN IDENTITY FIRST: You must find the ACTUAL NAME (First and Last) of the CEO, Managing Director, or Owner. 
2. FORBIDDEN VALUES: Returning "The Director", "Manager", "CEO of [Company]" or "Unknown" is a FAILURE. You MUST find a specific human name from LinkedIn, Facebook Team sections, or the official "About Us" page.
3. PROACTIVE EMAIL SEARCH: Identify the company domain. Look for verified "info@", "sales@", or "admin@" formats.
4. IDENTITY PERSISTENCE: You MUST return the "record_id" exactly as provided in the brackets [ID: ...].

REQUIRED OUTPUT FORMAT (RAW JSON ARRAY ONLY):
[{"record_id":"...","company_name":"...","contact_person":"SPECIFIC HUMAN NAME (e.g. Sipho Nkosi)","email_address":"...","telephone_number":"...","website":"...","physical_address":"..."}]

COMPANIES TO RESEARCH:
${companyList}`;

    const handleCopyAll = async () => {
        try {
            await navigator.clipboard.writeText(aiPrompt);
            setIsCopied(true);
            toast({ title: "Forensic Prompt Copied!", description: "The AI is now commanded to find actual human names." });
        } catch (e) {
            toast({ variant: 'destructive', title: "Copy Failed", description: "Please manually copy the text from the box." });
        }
    };

    const handleMarkAsResearching = async () => {
        if (selectedLeads.length === 0) return;
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed");

            const leadIds = selectedLeads.map(l => l.id);
            
            const response = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'markLeadsAsResearching', 
                    payload: { leadIds } 
                }),
            });

            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || "Failed to update records.");

            toast({ title: "Batch Locked", description: `${leadIds.length} records marked as 'Searching'. Paste results into Bulk Import when done.` });
            setIsCopied(false);
            onComplete();
            onOpenChange(false);
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Logging Failed", description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => { if(!isLoading) onOpenChange(o); }}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5 text-primary" />
                        Forensic Batch Enrichment ({selectedLeads.length})
                    </DialogTitle>
                    <DialogDescription>
                        Command the AI to perform a deep-search for actual leadership names and verified contacts.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    {!isCopied ? (
                        <Alert className="bg-amber-50 border-amber-200">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <AlertTitle>Step 1: Copy Forensic Prompt</AlertTitle>
                            <AlertDescription className="text-xs">The AI is now forbidden from returning "The Director" and must hunt for actual names on social platforms.</AlertDescription>
                        </Alert>
                    ) : (
                        <Alert className="bg-green-50 border-green-200 text-green-800">
                            <ClipboardCheck className="h-4 w-4 text-green-600" />
                            <AlertTitle>Step 2: Lock the Records</AlertTitle>
                            <AlertDescription className="text-xs">Records will be marked as "Searching" to prevent duplicate work. Proceed now.</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">AI Forensic Command</label>
                        <ScrollArea className="h-64 w-full border rounded-md p-3 bg-muted/30">
                            <pre className="text-[11px] whitespace-pre-wrap font-mono leading-relaxed text-foreground">{aiPrompt}</pre>
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter className="sm:justify-between gap-4">
                    <Button variant="outline" onClick={handleCopyAll}>
                        <Copy className="mr-2 h-4 w-4" /> Copy Prompt & IDs
                    </Button>
                    <Button onClick={handleMarkAsResearching} disabled={isLoading || !isCopied} className="bg-primary hover:bg-primary/90 text-white">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Zap className="mr-2 h-4 w-4" />}
                        Mark as Searching
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
