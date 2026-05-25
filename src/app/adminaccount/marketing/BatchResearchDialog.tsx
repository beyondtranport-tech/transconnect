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

    const companyNames = selectedLeads.map(l => l.companyName || `${l.firstName} ${l.lastName}`).join('\n');
    
    const aiPrompt = `I need you to act as a high-intelligence research agent. Your task is to find current contact and management details for the following South African companies.

RESEARCH STRATEGY:
1. Search extensively across LinkedIn, Facebook, X (Twitter), and Instagram for official business pages.
2. Check top regional directories: YellowPages.co.za, Brabys.com, EasyInfo.co.za, Snupit.co.za, and Cylex.net.za.
3. Look for professional email addresses. If not found, look for generic ones (info@, sales@, admin@) or personal management addresses found on social profiles.
4. Identify the name of a key decision-maker (Owner, Director, Manager, or Fleet Manager).
5. Cross-reference company names with 'South Africa' and 'Logistics' or 'Transport' to ensure accuracy.

OUTPUT FORMAT:
Provide the output ONLY as a clean JSON array of objects. DO NOT include any conversational text or markdown markers like \`\`\`json.

Each object MUST have these exact keys:
- company_name
- contact_person (Full Name)
- email_address (Verifiable)
- telephone_number (Local SA format or +27)
- website (Primary domain)
- physical_address (Full street address)

If a field is not found after deep searching, use null. DO NOT hallucinate.

COMPANIES TO RESEARCH:
${companyNames}`;

    const handleCopyAll = async () => {
        const fullText = `INSTRUCTIONS:\n${aiPrompt}\n\nLIST TO PROCESS:\n${companyNames}`;
        try {
            await navigator.clipboard.writeText(fullText);
            setIsCopied(true);
            toast({ title: "Prompt & List Copied!", description: "Paste this into Google AI now." });
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

            toast({ title: "Batch Locked", description: `${leadIds.length} records marked as 'Researching'. Use the Bulk Import tool to add results.` });
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
                        Enhance Batch of {selectedLeads.length}
                    </DialogTitle>
                    <DialogDescription>
                        Copy the optimized research prompt and mark these records as "Researching".
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    {!isCopied ? (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Step 1: Copy Prompt & List</AlertTitle>
                            <AlertDescription>Click the button below to copy the deep-search instructions and company list.</AlertDescription>
                        </Alert>
                    ) : (
                        <Alert className="bg-green-50 border-green-200 text-green-800">
                            <ClipboardCheck className="h-4 w-4 text-green-600" />
                            <AlertTitle>Step 2: Lock the Batch</AlertTitle>
                            <AlertDescription>Now click "Mark as Researching" to move these to the next processing stage.</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Deep Search Prompt (Copy this)</label>
                        <ScrollArea className="h-64 w-full border rounded-md p-3 bg-muted/30">
                            <pre className="text-[11px] whitespace-pre-wrap font-sans leading-relaxed text-foreground">{aiPrompt}</pre>
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter className="sm:justify-between gap-4">
                    <Button variant="outline" onClick={handleCopyAll}>
                        <Copy className="mr-2 h-4 w-4" /> Copy Prompt & List
                    </Button>
                    <Button onClick={handleMarkAsResearching} disabled={isLoading || !isCopied} className="bg-amber-600 hover:bg-amber-700 text-white">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ClipboardCheck className="mr-2 h-4 w-4" />}
                        Mark as Researching
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}