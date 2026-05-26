'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import { Loader2, Copy, ClipboardCheck, Zap, AlertCircle } from 'lucide-react';
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

    // ID-First identification for AI - minimized for token efficiency
    const companyList = selectedLeads.map(l => `[ID: ${l.id}] ${l.companyName || `${l.firstName} ${l.lastName}`}`).join('\n');
    
    const aiPrompt = `STRICT INSTRUCTION: RETURN ONLY A RAW JSON ARRAY. NO CONVERSATIONAL TEXT. NO MARKDOWN CODE BLOCKS. 

ACT AS A HIGH-INTELLIGENCE INVESTIGATIVE RESEARCH AGENT. Find CURRENT contact details for the following South African companies.

INVESTIGATIVE RULES:
1. IDENTITY PERSISTENCE (CRITICAL): For every record, you MUST return the "record_id" exactly as provided in the brackets [ID: ...]. This is used for database syncing.
2. LEADERSHIP SEARCH: Actively search for the name of the "Managing Director", "Owner", or "Principal". Return this in "contact_person".
3. REGISTRY CHECK: Cross-reference with the SARS Carrier/Clearing Database and CIPC records to find verified professional emails.

OUTPUT FORMAT (JSON ARRAY):
[{"record_id":"...","company_name":"...","contact_person":"...","email_address":"...","telephone_number":"...","website":"...","physical_address":"..."}]

COMPANIES TO RESEARCH:
${companyList}`;

    const handleCopyAll = async () => {
        try {
            await navigator.clipboard.writeText(aiPrompt);
            setIsCopied(true);
            toast({ title: "Prompt & List Copied!", description: "Paste this into your high-context AI (like Gemini 1.5 Pro) now." });
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

            toast({ title: "Batch Locked", description: `${leadIds.length} records marked as 'Searching'. Paste the results into Bulk Import when done.` });
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
                        <Zap className="h-5 w-5 text-amber-500" />
                        Master Batch Enrichment ({selectedLeads.length})
                    </DialogTitle>
                    <DialogDescription>
                        Copy this prompt and provide it to the AI. Then use **Bulk Import** to save the results.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    {!isCopied ? (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Step 1: Copy Prompt & IDs</AlertTitle>
                            <AlertDescription>The prompt below contains unique IDs. The AI must return these IDs for the import to correctly update your existing records.</AlertDescription>
                        </Alert>
                    ) : (
                        <Alert className="bg-green-50 border-green-200 text-green-800">
                            <ClipboardCheck className="h-4 w-4 text-green-600" />
                            <AlertTitle>Step 2: Lock the Records</AlertTitle>
                            <AlertDescription>Records will be marked as "Searching" so you don't process them twice. Proceed now.</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">High-Intelligence Research Prompt</label>
                        <ScrollArea className="h-64 w-full border rounded-md p-3 bg-muted/30">
                            <pre className="text-[11px] whitespace-pre-wrap font-sans leading-relaxed text-foreground">{aiPrompt}</pre>
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter className="sm:justify-between gap-4">
                    <Button variant="outline" onClick={handleCopyAll}>
                        <Copy className="mr-2 h-4 w-4" /> Copy Prompt & IDs
                    </Button>
                    <Button onClick={handleMarkAsResearching} disabled={isLoading || !isCopied} className="bg-amber-600 hover:bg-amber-700 text-white">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ClipboardCheck className="mr-2 h-4 w-4" />}
                        Mark as Searching
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
