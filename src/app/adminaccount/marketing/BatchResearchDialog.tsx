'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import { Loader2, Copy, Zap, Globe, ShieldCheck, AlertTriangle } from 'lucide-react';
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
    
    const aiPrompt = `ACT AS AN ELITE CORPORATE FORENSIC INVESTIGATOR. 
RETURN ONLY A RAW JSON ARRAY. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION. NO EXPLANATORY TEXT.

TASK: Bridge ALL data gaps for the South African businesses listed below. 

INVESTIGATIVE PROTOCOL (SEARCH GOOGLE, LINKEDIN, AND MAPS):
1. DISCOVER WEBSITE: Find the official corporate URL. This is your PRIMARY source of truth.
2. EXTRACT PHYSICAL ADDRESS: Find the EXACT OPERATIONAL ADDRESS (Street Number, Street Name, Suburb, City, Province, Postal Code). THIS IS CRITICAL. DO NOT LEAVE NULL. Use Google Maps to verify the physical location.
3. IDENTIFY LEADERSHIP: Find the ACTUAL NAME (First and Last) of the CEO, Managing Director, or Owner via LinkedIn.
4. MAP CONTACTS: Identify a professional email and a direct mobile number (+27 format).
5. MINE TECHNICAL STANDING: Use the key "notes" to provide a 2-3 sentence summary of their technical capabilities, fleet specializations, or core services from their "About" wording.

REQUIRED JSON FIELDS FOR EACH OBJECT:
- "record_id": (Return exactly as provided in the list below)
- "website": (Official URL)
- "address": (FULL Verified Physical Address)
- "contact_person": (Full Human Name of Decision Maker)
- "email": (Professional Email)
- "phone": (Landline)
- "mobile": (Direct Cell)
- "notes": (Technical Service Summary)

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
            <DialogContent className="sm:max-w-2xl text-left">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" />
                        Forensic Batch Discovery ({selectedLeads.length})
                    </DialogTitle>
                    <DialogDescription>
                        Copy this forensic command to bridge gaps for addresses, websites, and technical wording.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4 text-left">
                    {selectedLeads.length > 30 && (
                        <Alert variant="destructive" className="bg-destructive/10">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Large Batch Warning</AlertTitle>
                            <AlertDescription className="text-xs">
                                You have selected {selectedLeads.length} records. AI output may cut off mid-way. For best results, we recommend batches of <strong>20-30</strong>.
                            </AlertDescription>
                        </Alert>
                    )}

                    <Alert className="bg-primary/5 border-primary/20 text-left">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <AlertTitle className="text-left font-bold text-foreground">Schema-Aligned Command</AlertTitle>
                        <AlertDescription className="text-xs text-left">
                            This prompt is mapped to the <strong>Physical Address</strong> and <strong>Technical Summary</strong> fields in your CRM.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">AI Forensic Command</label>
                        <ScrollArea className="h-64 w-full border rounded-md p-3 bg-muted/30">
                            <pre className="text-[11px] whitespace-pre-wrap font-mono leading-relaxed text-foreground">{aiPrompt}</pre>
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