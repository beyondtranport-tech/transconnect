
'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import { Loader2, Zap, Globe, ShieldCheck, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { transporterCategories } from './transporter-discovery';

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
        throw new Error(result.error || `API Error for action: ${action}`);
    }
    return result;
}

export function BatchResearchDialog({ open, onOpenChange, selectedLeads, onComplete }: BatchResearchDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const { toast } = useToast();

    const companyList = selectedLeads.map(l => `[KEY: ${l.id}] ${l.companyName || `${l.firstName} ${l.lastName}`}`).join('\n');
    
    // Explicit list for the AI to pick from
    const validCategories = transporterCategories.join(', ');

    const aiPrompt = `ACT AS AN ELITE CORPORATE FORENSIC INVESTIGATOR. 
RETURN ONLY A RAW JSON ARRAY. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION.

STRICT DUAL-IDENTITY PROTOCOL:
1. MARKETING MANAGER: Find full name, direct professional email, and mobile.
2. CEO / MD / OWNER: Find full name, direct professional email, and mobile.

CONTENT MINING MANDATE:
1. SITE MAP CONTENT: For each record, extract approx 300 words of verbatim technical copy from "About", "Services", and "Products" sub-pages.

TASK: Bridge ALL data gaps for the South African businesses listed below. 

REQUIRED JSON FIELDS:
- "record_id": (Return exactly the KEY provided)
- "industrial_category": (Select from [${validCategories}])
- "website": (OFFICIAL CORPORATE URL)
- "email": (Primary Professional Email)
- "phone": (Landline)
- "mobile": (Primary Mobile)
- "address": (FULL Verified Physical Address)
- "marketingManager": { "name": "...", "email": "...", "mobile": "..." }
- "ceo": { "name": "...", "email": "...", "mobile": "..." }
- "minedServiceWording": "CONCATENATED RAW SITE TEXT (300 WORDS)"

LIST TO INVESTIGATE:
${companyList}`;

    const handleCopyAndLogBatch = async () => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed");

            await navigator.clipboard.writeText(aiPrompt);
            setIsCopied(true);

            const leadIds = selectedLeads.map(l => l.id);
            const isLeadBatch = selectedLeads.length > 0 && (!selectedLeads[0].type || selectedLeads[0].type === 'lead');
            
            await performAdminAction(token, 'bulkLogForensicInitiated', { 
                leadIds,
                type: isLeadBatch ? 'lead' : 'partner'
            });

            toast({ title: "Forensic Prompt Ready", description: `${leadIds.length} records marked as 'Searching' in Oversight.` });
            
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
            <DialogContent className="sm:max-w-2xl text-left text-foreground">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-left">
                        <Globe className="h-5 w-5 text-primary" />
                        Forensic Batch Discovery ({selectedLeads.length})
                    </DialogTitle>
                    <DialogDescription className="text-left text-foreground">
                        Copy this forensic command to bridge gaps for addresses, websites, and technical categories using the provided record keys.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4 text-left text-foreground">
                    <Alert className="bg-primary/5 border-primary/20 text-left">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <AlertTitle className="text-left font-bold text-foreground">Dual-Identity Protocol Active</AlertTitle>
                        <AlertDescription className="text-xs text-left">
                            The agent will attempt to map <strong>both</strong> the Marketing Manager and CEO for every record in the batch.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">AI Forensic Command</label>
                        <ScrollArea className="h-64 w-full border rounded-md p-3 bg-muted/30 text-left text-foreground">
                            <pre className="text-[11px] whitespace-pre-wrap font-mono leading-relaxed text-foreground text-left">{aiPrompt}</pre>
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleCopyAndLogBatch} disabled={isLoading} className="w-full h-12 text-lg font-bold">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Zap className="mr-2 h-4 w-4" />}
                        {isCopied ? 'Prompt Ready!' : 'Copy Prompt & Update Oversight'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
