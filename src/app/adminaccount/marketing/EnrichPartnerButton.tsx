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
        // 1. Map current profile to identify GIVEN DATA
        const currentData = {
            companyName: companyName,
            contactPerson: partner.contactPerson || 'Unknown',
            email: partner.email || 'Missing',
            phone: partner.phone || 'Missing',
            mobile: partner.mobile || 'Missing',
            website: partner.website || 'Missing',
            address: partner.address || 'Missing'
        };

        // 2. Perform GAP ANALYSIS for the AI
        const gaps = Object.entries(currentData)
            .filter(([_, v]) => v === 'Missing' || v === 'Unknown')
            .map(([k]) => k);

        const baseInstructions = `ACT AS AN ELITE CORPORATE INTELLIGENCE AGENT. 
RETURN ONLY A RAW JSON OBJECT. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION.

GIVEN DATA (YOUR STARTING POINT):
${JSON.stringify(currentData, null, 2)}

INFORMATION GAP ANALYSIS (YOUR SPECIFIC OBJECTIVES):
The following information is missing from our records for "${companyName}" and MUST be discovered: ${gaps.join(', ')}.

TASK: Use the GIVEN DATA as your baseline to perform a deep-search for the missing fields.
1. IDENTITY VERIFICATION: Use LinkedIn or company registries to find the ACTUAL NAME of the CEO, MD, or Owner. 
2. CONTACT DISCOVERY: Identify the direct work email and prioritize finding a DIRECT MOBILE number (e.g. +27 82...).
3. PERSISTENCE: You MUST return the "record_id": "${partner.id}" exactly as provided.

REQUIRED OUTPUT FORMAT (RAW JSON ONLY):
{
  "record_id": "${partner.id}",
  "companyName": "${companyName}",
  "contactPerson": "SPECIFIC HUMAN FULL NAME (NOT A TITLE)",
  "email": "Verified Professional Email",
  "phone": "Company Landline (Work)",
  "mobile": "Verified DIRECT MOBILE/CELL (+27...)",
  "website": "Official URL",
  "address": "Full Physical Headquarters Address"
}`;

        if (isDriver) {
            return `ACT AS AN ELITE WORKFORCE INTELLIGENCE AGENT.
RETURN ONLY A RAW JSON OBJECT. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION.

DRIVER IDENTITY: ${partner.service_handle || `${partner.firstName} ${partner.lastName}`}
KNOWN DATA: ${JSON.stringify(currentData, null, 2)}

TASK: Hunt for the DIRECT digital contact channels for this commercial driver.
1. MOBILE DISCOVERY: Prioritize finding the direct cell number (+27...). 
2. IDENTITY PERSISTENCE: Return "record_id": "${partner.id}".

REQUIRED OUTPUT (RAW JSON ONLY):
{
  "record_id": "${partner.id}",
  "firstName": "${partner.firstName}",
  "lastName": "${partner.lastName}",
  "email": "Verified Direct Email",
  "phone": "General Landline",
  "mobile": "Verified DIRECT MOBILE (Cell)",
  "notes": "Current capability summary",
  "address": "Primary Operational Region"
}`;
        }

        return baseInstructions;
    };

    const aiPrompt = getPrompt();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(aiPrompt);
            setIsCopied(true);
            toast({ title: "Forensic Command Copied!", description: "AI is now commanded to bridge the information gaps." });
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

            toast({ title: "Record Locked", description: "This entity is now in the 'Searching' queue." });
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
                title="Perform Gap Analysis"
            >
                <Search className="h-4 w-4 text-primary" />
            </Button>

            <Dialog open={isOpen} onOpenChange={(o) => !isLogging && setIsOpen(o)}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Forensic Gap-Analysis
                        </DialogTitle>
                        <DialogDescription>
                            Analyzing <strong>{companyName}</strong> to identify and bridge missing contact data.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <Alert className="bg-primary/5 border-primary/20">
                            <Info className="h-4 w-4 text-primary" />
                            <AlertTitle>Intelligence Objective</AlertTitle>
                            <AlertDescription className="text-xs text-muted-foreground">
                                This prompt provides the AI with your known baseline and commands it to hunt for the specifically missing data points.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">Forensic Command</label>
                            <ScrollArea className="h-48 w-full border rounded-md p-3 bg-muted/30 text-foreground text-left">
                                <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed">{aiPrompt}</pre>
                            </ScrollArea>
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-between gap-4">
                        <Button variant="outline" onClick={handleCopy}>
                            {isCopied ? <ClipboardCheck className="mr-2 h-4 w-4 text-green-600" /> : <Search className="mr-2 h-4 w-4" />}
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
