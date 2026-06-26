'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, ClipboardCheck, Info, Zap, Search } from 'lucide-react';
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
        throw new Error(result.error || `API Error for action: ${action}`);
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
        const currentData = {
            companyName: companyName,
            contactPerson: partner.contactPerson || 'Unknown',
            email: partner.email || 'Missing',
            phone: partner.phone || 'Missing',
            mobile: partner.mobile || 'Missing',
            website: partner.website || 'Missing',
            address: partner.address || 'Missing'
        };

        const gaps = Object.entries(currentData)
            .filter(([_, v]) => v === 'Missing' || v === 'Unknown')
            .map(([k]) => k);

        return `ACT AS AN ELITE CORPORATE INTELLIGENCE AGENT. 
RETURN ONLY A RAW JSON OBJECT. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION.

GIVEN DATA:
${JSON.stringify(currentData, null, 2)}

GAP ANALYSIS: ${gaps.join(', ')}.

TASK: Discover and bridge these gaps.
1. FIND ACTUAL NAME: CEO/MD/Owner. 
2. FIND DIRECT CONTACTS: Professional email and DIRECT MOBILE (+27...).
3. PERSISTENCE: Return "record_id": "${partner.id}".

REQUIRED FORMAT:
{
  "record_id": "${partner.id}",
  "companyName": "${companyName}",
  "contactPerson": "FULL NAME",
  "email": "...",
  "phone": "Landline",
  "mobile": "DIRECT CELL",
  "website": "...",
  "address": "..."
}`;
    };

    const handleCopyAndLog = async () => {
        setIsLogging(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed");

            // 1. Copy to clipboard
            await navigator.clipboard.writeText(getPrompt());
            setIsCopied(true);

            // 2. Automate logging and status change
            await performAdminAction(token, 'logForensicInitiated', { 
                partnerId: partner.id,
                isLead: !partner.type || partner.type === 'lead'
            });

            toast({ title: "Prompt Copied & Logged", description: "Oversight timeline updated automatically." });
            
            // Close after small delay to show feedback
            setTimeout(() => {
                setIsOpen(false);
                onUpdate();
            }, 1000);

        } catch (e: any) {
            toast({ variant: 'destructive', title: "Automation Failed", description: e.message });
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
                title="Forensic Gap-Analysis"
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
                            Command the AI to bridge missing data for <strong>{companyName}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4 text-left">
                        <Alert className="bg-primary/5 border-primary/20">
                            <Zap className="h-4 w-4 text-primary" />
                            <AlertTitle>Zero-Step Automation</AlertTitle>
                            <AlertDescription className="text-xs">
                                Clicking the button below will copy the command and automatically record this research event in the **Oversight Timeline**.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Forensic Command Preview</label>
                            <ScrollArea className="h-48 w-full border rounded-md p-3 bg-muted/30 text-foreground">
                                <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed">{getPrompt()}</pre>
                            </ScrollArea>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button 
                            onClick={handleCopyAndLog} 
                            disabled={isLogging} 
                            className="w-full bg-primary hover:bg-primary/90 text-white"
                        >
                            {isLogging ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4" />}
                            {isCopied ? 'Prompt Ready!' : 'Copy Forensic Prompt & Start Logging'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
