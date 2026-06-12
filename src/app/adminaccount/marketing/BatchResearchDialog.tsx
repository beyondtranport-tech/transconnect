'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import { Loader2, Copy, Zap, Info, Globe } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface BatchResearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedLeads: any[];
    onComplete: () => void;
}

async function performAdminAction(token: string, action: string, payload: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error: ${action}`);
    }
    return result;
}

export function BatchResearchDialog({ open, onOpenChange, selectedLeads, onComplete }: BatchResearchDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const { toast } = useToast();

    const companyList = selectedLeads.map(l => `[ID: ${l.id}] ${l.companyName || `${l.firstName} ${l.lastName}`}`).join('\n');
    
    const aiPrompt = `CRITICAL SYSTEM INSTRUCTION: RETURN ONLY A RAW JSON ARRAY. NO MARKDOWN. NO CONVERSATION.

TASK: Discover the OFFICIAL CORPORATE WEBSITE for the following South African businesses. 
Once the website is identified, use it as the source of truth to bridge the following gaps:

1. WEBSITE: Find the primary URL (e.g., www.company.co.za).
2. HUMAN IDENTITY: Find ACTUAL NAME of CEO, MD, or Owner.
3. PRIMARY SERVICES: Extract a 2-sentence summary of their "About" or "Services" wording.
4. PERSISTENCE: Return "record_id" exactly as provided.

COMPANIES TO INVESTIGATE:
${companyList}`;

    const handleCopyAndLogBatch = async () => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed");

            // 1. Copy refined prompt
            await navigator.clipboard.writeText(aiPrompt);
            setIsCopied(true);

            // 2. Automate logging for the batch
            const leadIds = selectedLeads.map(l => l.id);
            await performAdminAction(token, 'bulkLogForensicInitiated', { leadIds });

            toast({ title: "Batch Logged & Copied", description: `${leadIds.length} records marked as 'Searching' in Oversight.` });
            
            setTimeout(() => {
                onOpenChange(false);
                onComplete();
            }, 1000);

        } catch (e: any) {
            toast({ variant: 'destructive', title: "Log Failed", description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !isLoading && onOpenChange(o)}>
            <DialogContent className="sm:max-w-2xl text-left">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" />
                        Website & Asset Discovery ({selectedLeads.length})
                    </DialogTitle>
                    <DialogDescription>
                        Copy the command to bridge gaps for these records. The primary focus is finding official corporate URLs.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <Alert className="bg-primary/5 border-primary/20">
                        <Info className="h-4 w-4 text-primary" />
                        <AlertTitle>Refined Discovery Logic</AlertTitle>
                        <AlertDescription className="text-xs">
                            This prompt prioritizes website discovery as the key to unlocking MD names and service wording.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">AI Forensic Command</label>
                        <ScrollArea className="h-64 w-full border rounded-md p-3 bg-muted/30">
                            <pre className="text-[11px] whitespace-pre-wrap font-mono leading-relaxed text-foreground">{aiPrompt}</pre>
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleCopyAndLogBatch} disabled={isLoading} className="w-full h-12 text-lg font-bold">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Zap className="mr-2 h-4 w-4" />}
                        {isCopied ? 'Batch Logged!' : 'Copy & Start Discovery Batch'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
