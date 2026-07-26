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
        return `ACT AS AN ELITE SOUTH AFRICAN INDUSTRIAL RESEARCH AGENT (V6 - DEEP SCAVENGER).
        
TASK: Perform a high-velocity investigation to bridge ALL data gaps for: "${companyName}".

REQUIRED INVESTIGATION PROTOCOL:
1. WEBSITE & SITEMAP: Locate the official website. Scan the Sitemap, "Meet the Team", and "Contact" sub-pages to extract names of the CEO, MD, and Marketing Manager.
2. IDENTITY RESOLUTION: Use the extracted names to perform targeted SECONDARY searches on LinkedIn, Facebook, and Instagram for those specific individuals to resolve their direct professional email and mobile numbers.
3. AGGREGATOR SCAN: Use SA Directories (Brabys, Yellosa, Infoisinfo) to find landlines and general company emails if still missing.

DATA FIDELITY (ANTI-BOUNCE):
- REAL DATA ONLY: Do not invent names or guess emails based on patterns.
- NULL MANDATE: If after checking ALL sources and performing secondary identity lookups data is still missing, return null.

RETURN ONLY A RAW JSON OBJECT:
{
  "record_id": "${partner.id}",
  "companyName": "${companyName}",
  "industrial_category": "...",
  "website": "OFFICIAL CORPORATE URL",
  "email": "VERIFIED GENERAL EMAIL",
  "phone": "RSA LANDLINE",
  "address": "VERIFIED PHYSICAL ADDRESS",
  "marketingManager": { 
      "name": "VERIFIED NAME", 
      "email": "VERIFIED DIRECT EMAIL", 
      "mobile": "VERIFIED MOBILE" 
  },
  "ceo": { 
      "name": "VERIFIED OWNER/MD NAME", 
      "email": "VERIFIED DIRECT EMAIL", 
      "mobile": "VERIFIED MOBILE" 
  },
  "minedServiceWording": "CONCATENATED RAW SITE TEXT (300 WORDS) - MINE THE PRODUCT/SERVICE PAGES."
}

NO MARKDOWN. NO PREAMBLE.`;
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

            toast({ title: "Scavenger Prompt Ready", description: "V6 Mandate copied. Paste into AI Studio." });
            
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
                title="Industrial Gap Analysis"
            >
                <Search className="h-4 w-4 text-primary" />
            </Button>

            <Dialog open={isOpen} onOpenChange={(o) => !isLogging && setIsOpen(o)}>
                <DialogContent className="sm:max-w-xl text-left text-foreground">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-left text-foreground font-black">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Industrial Gap-Analysis V6
                        </DialogTitle>
                        <DialogDescription className="text-left text-foreground">
                            Generate a deep scavenger command for <strong>{companyName}</strong> using sitemap and identity resolution.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4 text-left text-foreground">
                        <Alert className="bg-primary/5 border-primary/20 text-left">
                            <Zap className="h-4 w-4 text-primary" />
                            <AlertTitle className="text-left font-bold text-foreground text-left">V6 Sitemap Protocol Active</AlertTitle>
                            <AlertDescription className="text-xs text-left text-foreground">
                                This command instructs the AI to mine the sitemap for employee lists, then pivot to social platforms to resolve their direct contact details.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2 text-left">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">AI Research Command</label>
                            <ScrollArea className="h-48 w-full border rounded-md p-3 bg-muted/30 text-left text-foreground">
                                <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed text-foreground">{getPrompt()}</pre>
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
                            {isCopied ? 'Command Ready!' : 'Copy V6 Scavenger Prompt'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
