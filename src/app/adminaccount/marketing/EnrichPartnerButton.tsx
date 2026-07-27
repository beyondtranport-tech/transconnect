
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Info, Zap, Search, ClipboardCheck } from 'lucide-react';
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

    const companyName = partner.companyName || partner.trading_name || `${partner.firstName} ${partner.lastName}` || 'Unnamed Entity';

    const getPrompt = () => {
        return `ACT AS AN ELITE SOUTH AFRICAN INDUSTRIAL RESEARCH AGENT (V13 - INDUCTIVE SCAVENGER).
        
TASK: Complete a forensic gap-analysis for: "${companyName}". Use an aggressive, inductive reconstruction approach to eliminate all null fields.

INVESTIGATION MANDATE (V13 PROTOCOL):
1. IDENTITY EXPANSION: If the name is an acronym or short-hand (e.g. "JH"), you MUST first determine the full legal identity (e.g. "Junior H").
2. FRAGMENT STITCHING: You MUST combine data fragments from multiple sources.
3. FLAT-SITE RESILIENCY: Industrial sites are often one-page. Analyze snippets for "Contact Cards" and "Footer Sections" specifically.
4. IDENTITY RESOLUTION: Find the names and contacts of: CEO, Marketing Lead, Operations Manager, and Technical/Maintenance Manager.
5. AGGREGATOR SYNC: Use SA directories (Yellosa, Brabys, Infoisinfo) to populate fields.

RETURN ONLY A RAW JSON OBJECT. NO MARKDOWN. NO CODE BLOCKS. NO PREAMBLE.

{
  "record_id": "${partner.id}",
  "companyName": "FULL REGISTERED NAME",
  "industrial_category": "Refined Category",
  "website": "VERIFIED URL",
  "email": "VERIFIED GENERAL EMAIL",
  "phone": "RSA LANDLINE",
  "address": "VERIFIED PHYSICAL ADDRESS",
  "marketingManager": { "name": "VERIFIED NAME", "email": "VERIFIED EMAIL", "mobile": "VERIFIED MOBILE" },
  "operationsManager": { "name": "VERIFIED NAME", "email": "VERIFIED EMAIL", "mobile": "VERIFIED MOBILE" },
  "technicalManager": { "name": "VERIFIED NAME", "email": "VERIFIED EMAIL", "mobile": "VERIFIED MOBILE" },
  "ceo": { "name": "VERIFIED NAME", "email": "VERIFIED EMAIL", "mobile": "VERIFIED MOBILE" },
  "minedServiceWording": "TECHNICAL SUMMARY MINED FROM SITE SECTIONS (300 WORDS)."
}`;
    };

    const handleCopyAndLog = async () => {
        setIsLogging(true);
        try {
            await navigator.clipboard.writeText(getPrompt());
            setIsCopied(true);

            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Session expired.");

            await performAdminAction(token, 'logForensicInitiated', { 
                partnerId: partner.id,
                isLead: !partner.type || partner.type === 'lead'
            });

            toast({ title: "V13 Scavenger Prompt Ready", description: "Expanded to include Operations and Technical leads." });
            
            setTimeout(() => {
                setIsOpen(false);
                onUpdate();
            }, 1000);

        } catch (e: any) {
            toast({ variant: 'destructive', title: "Automation Error", description: e.message });
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
                title="Forensic Gap Analysis"
            >
                <Search className="h-4 w-4 text-primary" />
            </Button>

            <Dialog open={isOpen} onOpenChange={(o) => !isLogging && setIsOpen(o)}>
                <DialogContent className="sm:max-w-xl text-left text-foreground">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-left text-foreground font-black">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Industrial Gap-Analysis V13
                        </DialogTitle>
                        <DialogDescription className="text-left text-foreground">
                            Generate an aggressive V13 scavenger command for <strong>{companyName}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4 text-left">
                        <Alert className="bg-primary/5 border-primary/20 text-left">
                            <Zap className="h-4 w-4 text-primary" />
                            <AlertTitle className="text-left font-bold">V13 Stakeholder Mandate Active</AlertTitle>
                            <AlertDescription className="text-xs text-left">
                                The scavenger will now prioritize finding Operations and Technical leads in addition to the CEO and Marketing.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2 text-left">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">AI Research Command</label>
                            <ScrollArea className="h-48 w-full border rounded-md p-3 bg-muted/30 text-left">
                                <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed">{getPrompt()}</pre>
                            </ScrollArea>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button 
                            onClick={handleCopyAndLog} 
                            disabled={isLogging} 
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold"
                        >
                            {isLogging ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4" />}
                            {isCopied ? 'V13 Command Ready!' : 'Copy V13 Scavenger Prompt'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
