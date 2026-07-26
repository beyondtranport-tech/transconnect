'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import { Loader2, Zap, Globe, ShieldCheck, AlertTriangle, SearchCode } from 'lucide-react';
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
    const validCategories = transporterCategories.join(', ');

    const aiPrompt = `ACT AS AN ELITE SOUTH AFRICAN INDUSTRIAL RESEARCH AGENT (V5 - BATCH SCAVENGER). 
RETURN ONLY A RAW JSON ARRAY. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION.

REQUIRED INVESTIGATION PROTOCOL PER RECORD:
1. GO DEEP: For each company below, find the official website. Do not stop at the home page. Check "About", "Team", "Contact", and "Services".
2. SOCIAL CROSS-REFERENCE: Search LinkedIn and Facebook for the entity. Identify the ACTUAL FULL NAMES of the MD, CEO, or Marketing Lead.
3. DIRECT CONTACTS: If landlines or emails are not on the site, check SA business directories (Brabys, Yellosa, Infoisinfo).
4. ZERO TOLERANCE FOR MOCK DATA: If data is not discovered, return null. Never guess or synthesize emails.

STRICT REGIONAL LOCK:
Bridge gaps only for SOUTH AFRICAN operations. Ignore all results for international branches.

LIST TO INVESTIGATE (RSA ENTITIES ONLY):
${companyList}

JSON OUTPUT REQUIREMENTS:
- "record_id": (Return exactly the [KEY] provided)
- "companyName": (Standardize to the official registered name)
- "industrial_category": (Select from [${validCategories}])
- "website": (OFFICIAL CORPORATE URL)
- "email": (General Company Email)
- "phone": (RSA Landline)
- "address": (FULL Verified Physical Address in South Africa)
- "marketingManager": { "name": "...", "email": "...", "mobile": "..." }
- "ceo": { "name": "...", "email": "...", "mobile": "..." }
- "minedServiceWording": "CONCATENATED RAW SITE TEXT (300 WORDS) - MINE THE TECHNICAL PAGES."`;

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

            toast({ title: "Batch Scavenger Ready", description: "Paste into AI Studio to bridge gaps." });
            
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
                    <DialogTitle className="flex items-center gap-2 text-left font-black">
                        <SearchCode className="h-5 w-5 text-primary" />
                        Batch Scavenger V5
                    </DialogTitle>
                    <DialogDescription className="text-left text-foreground">
                        High-velocity batch research mandate for South African industrial entities.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4 text-left text-foreground">
                    <Alert className="bg-primary/5 border-primary/20 text-left">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <AlertTitle className="font-bold text-foreground">Deep Discovery Mandated</AlertTitle>
                        <AlertDescription className="text-xs text-left">
                            The agent is commanded to crawl sub-pages and directories. Hallucination is strictly forbidden.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">AI Research Command</label>
                        <ScrollArea className="h-64 w-full border rounded-md p-3 bg-muted/30 text-left">
                            <pre className="text-[11px] whitespace-pre-wrap font-mono leading-relaxed text-foreground">{aiPrompt}</pre>
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleCopyAndLogBatch} disabled={isLoading} className="w-full h-12 text-lg font-bold">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Zap className="mr-2 h-4 w-4" />}
                        {isCopied ? 'Batch Command Ready!' : 'Copy Batch Scavenger'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
