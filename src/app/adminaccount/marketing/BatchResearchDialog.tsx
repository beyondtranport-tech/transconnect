
'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import { Loader2, Copy, ClipboardCheck, Zap } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BatchResearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedLeads: any[];
    onComplete: () => void;
}

export function BatchResearchDialog({ open, onOpenChange, selectedLeads, onComplete }: BatchResearchDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const companyNames = selectedLeads.map(l => l.companyName || `${l.firstName} ${l.lastName}`).join('\n');
    
    const aiPrompt = `I need you to act as a precision research agent. Find the current contact and management details for the following South African companies. 

Provide the output ONLY as a clean JSON array of objects. 
Each object MUST have these exact keys:
- company_name
- contact_person (Owner, Director, or Manager)
- email_address (verifiable professional address)
- telephone_number (local SA format or +27)
- website (primary domain)
- physical_address (full street address)

If a field is not found, use null. DO NOT hallucinate.

COMPANIES TO RESEARCH:
${companyNames}`;

    const handleCopyAll = async () => {
        const fullText = `PROMPT:\n${aiPrompt}\n\nLIST:\n${companyNames}`;
        try {
            await navigator.clipboard.writeText(fullText);
            toast({ title: "Copied to Clipboard!", description: "Paste this into Google AI (Gemini/ChatGPT)." });
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

            toast({ title: "Batch Locked", description: `${leadIds.length} records marked as 'Researching'. Sequential queue updated.` });
            onComplete();
            onOpenChange(false);
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Logging Failed", description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-amber-500" />
                        Enhance Batch of {selectedLeads.length}
                    </DialogTitle>
                    <DialogDescription>
                        Copy the names and the pre-formatted prompt below. Once you've copied them, mark them as "Researching" to move to the next batch.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">The AI Prompt (Precision Engineered)</label>
                        <ScrollArea className="h-48 w-full border rounded-md p-3 bg-muted/30">
                            <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed">{aiPrompt}</pre>
                        </ScrollArea>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Target Batch List</label>
                        <ScrollArea className="h-24 w-full border rounded-md p-3 bg-muted/10 font-mono text-[10px]">
                            {companyNames}
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter className="sm:justify-between gap-4">
                    <Button variant="outline" onClick={handleCopyAll}>
                        <Copy className="mr-2 h-4 w-4" /> Copy Prompt & List
                    </Button>
                    <Button onClick={handleMarkAsResearching} disabled={isLoading} className="bg-amber-600 hover:bg-amber-700 text-white">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ClipboardCheck className="mr-2 h-4 w-4" />}
                        Mark as Researching & Next 50
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
