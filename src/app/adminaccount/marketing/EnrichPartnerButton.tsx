'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Copy, ClipboardCheck, Info, Zap, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

export function EnrichPartnerButton({ partner, onUpdate }: { partner: any, onUpdate: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLogging, setIsLogging] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const { toast } = useToast();

    const companyName = partner.companyName || partner.trading_name || `${partner.firstName} ${partner.lastName}`;
    const isDriver = partner.type === 'driver' || partner.role === 'Drivers';

    const getPrompt = () => {
        // Build the current knowledge profile
        const currentData = {
            companyName: companyName,
            contactPerson: partner.contactPerson || 'Unknown',
            email: partner.email || 'Missing',
            phone: partner.phone || 'Missing',
            mobile: partner.mobile || 'Missing',
            website: partner.website || 'Missing',
            address: partner.address || 'Missing'
        };

        // Explicitly identify what information is lacking
        const gaps = Object.entries(currentData)
            .filter(([_, v]) => v === 'Missing' || v === 'Unknown')
            .map(([k]) => k);

        const baseInstructions = `ACT AS AN ELITE CORPORATE INTELLIGENCE AGENT. 
RETURN ONLY A RAW JSON OBJECT. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION. NO EXPLANATORY TEXT.

GIVEN DATA (USE THIS AS YOUR STARTING POINT):
${JSON.stringify(currentData, null, 2)}

INFORMATION GAPS (PRIORITY OBJECTIVES):
${gaps.join(', ')}

TASK: Use the GIVEN DATA to find the missing fields.
1. FORENSIC IDENTITY: You MUST locate the ACTUAL NAME of the CEO, Owner, or MD. 
2. DIFFERENTIATION: Differentiate between the Company Landline ("phone") and the Director's Direct Cell ("mobile").
3. SOURCES: Use LinkedIn, Google Maps, Facebook Business, and corporate "About" pages.
4. IDENTITY PERSISTENCE: You MUST return "record_id": "${partner.id}" exactly.

REQUIRED OUTPUT (RAW JSON ONLY):
{
  "record_id": "${partner.id}",
  "companyName": "${companyName}",
  "contactPerson": "ACTUAL HUMAN FULL NAME",
  "email": "Verified Email",
  "phone": "Verified Landline",
  "mobile": "Verified DIRECT MOBILE (e.g. +27 82...)",
  "website": "URL",
  "address": "Full Physical Address"
}`;

        if (isDriver) {
            return `ACT AS AN ELITE WORKFORCE INTELLIGENCE AGENT.
RETURN ONLY A RAW JSON OBJECT. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION.

DRIVER PROFILE: ${partner.service_handle || `${partner.firstName} ${partner.lastName}`}
CURRENT DATA: ${JSON.stringify({ phone: partner.phone, hub: partner.operational_hub }, null, 2)}

TASK: Find the DIRECT digital channels for this operator.
1. MOBILE DISCOVERY: Hunt for the direct cell number (+27...). LANDLINES ARE FAILURES for drivers.
2. EMAIL DISCOVERY: Find the verified personal or professional email.
3. PERSISTENCE: Return "record_id": "${partner.id}".

REQUIRED OUTPUT (RAW JSON ONLY):
{
  "record_id": "${partner.id}",
  "firstName": "${partner.firstName}",
  "lastName": "${partner.lastName}",
  "email": "Verified Direct Email",
  "phone": "Landline",
  "mobile": "Verified DIRECT MOBILE",
  "notes": "Consolidated capability profile",
  "address": "Primary Region"
}`;
        }

        return baseInstructions;
    };

    const aiPrompt = getPrompt();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(aiPrompt);
            setIsCopied(true);
            toast({ title: "Forensic Prompt Copied!", description: "AI is now instructed to bridge the detected information gaps using your existing data." });
        } catch (e) {
            toast({ variant: 'destructive', title: "Copy Failed" });
        }
    };

    const handleMarkAsResearching = async () => {
        setIsLogging(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed");

            await performAdminAction(token, 'markLeadsAsResearching', { 
                leadIds: [partner.id] 
            });

            toast({ title: "Status Updated", description: "Record is now locked in the 'Searching' queue." });
            setIsOpen(false);
            onUpdate();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Update Failed", description: e.message });
        } finally {
            setIsLogging(false);
        }
    };

    return (
        <>
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => { setIsCopied(false); setIsOpen(true); }} 
                title="Forensic Intelligence"
            >
                <Search className="h-4 w-4 text-primary" />
            </Button>

            <Dialog open={isOpen} onOpenChange={(o) => !isLogging && setIsOpen(o)}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Gap-Analysis Intelligence Pass
                        </DialogTitle>
                        <DialogDescription>
                            Performing a forensic audit for <strong>{companyName}</strong>. 
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <Alert className="bg-primary/5 border-primary/20">
                            <Info className="h-4 w-4 text-primary" />
                            <AlertTitle>Start Point Intelligence</AlertTitle>
                            <AlertDescription className="text-xs text-muted-foreground">
                                This prompt identifies exactly what is missing and commands the AI to use your current data to find the specific missing leadership and cell details.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">AI Forensic Command</label>
                            <ScrollArea className="h-48 w-full border rounded-md p-3 bg-muted/30 text-foreground">
                                <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed">{aiPrompt}</pre>
                            </ScrollArea>
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-between gap-4">
                        <Button variant="outline" onClick={handleCopy}>
                            <Copy className="mr-2 h-4 w-4" /> 
                            {isCopied ? 'Copied!' : 'Copy Forensic Prompt'}
                        </Button>
                        <Button onClick={handleMarkAsResearching} disabled={isLogging || !isCopied} className="bg-primary hover:bg-primary/90 text-white">
                            {isLogging ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Zap className="mr-2 h-4 w-4" />}
                            Mark as Searching
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export function BulkEnrichButton({ partners, onComplete }: { partners: any[], onComplete: () => void }) {
    const [open, setOpen] = useState(false);
    const selectedPartners = useMemo(() => {
        return partners.filter(p => (!p.email || p.email === 'null' || p.email === 'Missing') || p.researchStatus === 'researching').slice(0, 10);
    }, [partners]);

    return (
        <BatchResearchDialog 
            open={open} 
            onOpenChange={setOpen} 
            selectedLeads={selectedPartners} 
            onComplete={onComplete} 
        />
    );
}

function BatchResearchDialog({ open, onOpenChange, selectedLeads, onComplete }: any) {
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const { toast } = useToast();

    const companyList = selectedLeads.map((l: any) => `[ID: ${l.id}] ${l.companyName || l.service_handle}`).join('\n');
    
    const aiPrompt = `CRITICAL SYSTEM INSTRUCTION: RETURN ONLY A RAW JSON ARRAY. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION. NO EXPLANATORY TEXT.

ACT AS AN ELITE CORPORATE INTELLIGENCE AGENT. 

TASK: Find CURRENT verified leadership and direct digital contact details for the following South African entities.

INVESTIGATIVE STRATEGY:
1. HUMAN IDENTITY: You MUST find the ACTUAL NAME of the CEO, MD, or Owner. 
2. CONTACT DIFFERENTIATION: Differentiate between "phone" (Work Landline) and "mobile" (Direct Cell +27...).
3. IDENTITY PERSISTENCE: You MUST return the "record_id" exactly as provided.

REQUIRED OUTPUT FORMAT (RAW JSON ARRAY ONLY):
[{"record_id":"...","companyName":"...","contactPerson":"FULL NAME","email":"...","phone":"Landline","mobile":"Direct Cell","website":"...","address":"..."}]

ENTITIES TO RESEARCH:
${companyList}`;

    const handleCopyAll = async () => {
        try {
            await navigator.clipboard.writeText(aiPrompt);
            setIsCopied(true);
            toast({ title: "Batch Prompt Copied!" });
        } catch (e) {
            toast({ variant: 'destructive', title: "Copy Failed" });
        }
    };

    const handleMarkAsResearching = async () => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed");
            const leadIds = selectedLeads.map((l: any) => l.id);
            await performAdminAction(token, 'markLeadsAsResearching', { leadIds });
            toast({ title: "Batch Marked as Searching" });
            onComplete();
            onOpenChange(false);
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Update Failed", description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Batch Forensic Enrichment ({selectedLeads.length})</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <ScrollArea className="h-64 border rounded-md p-4 bg-muted/30">
                        <pre className="text-[10px] font-mono whitespace-pre-wrap">{aiPrompt}</pre>
                    </ScrollArea>
                </div>
                <DialogFooter className="sm:justify-between">
                    <Button variant="outline" onClick={handleCopyAll}>
                        <Copy className="mr-2 h-4 w-4" /> Copy Prompt
                    </Button>
                    <Button onClick={handleMarkAsResearching} disabled={isLoading || !isCopied}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Zap className="mr-2 h-4 w-4" />}
                        Mark as Searching
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
