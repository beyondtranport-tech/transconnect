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
        return `ACT AS AN ELITE SOUTH AFRICAN INDUSTRIAL RESEARCH AGENT (V8 - FORENSIC SCAVENGER).
        
TASK: Perform an aggressive investigation to bridge ALL data gaps for: "${companyName}".

INVESTIGATION PROTOCOL:
1. DOMAIN SEARCH: Broaden your search to find the official website. Use variants like "${companyName} South Africa". Look for .co.za domains.
2. SITEMAP DEEP-DIVE: Once you find the site, search sub-pages ("Team", "About", "Management", "Contact") to identify ACTUAL NAMES of the CEO, MD, and Marketing Lead.
3. IDENTITY RESOLUTION: Perform targeted secondary searches on LinkedIn and Facebook for identified individuals to resolve professional emails and direct mobile numbers.
4. DIRECTORY FALLBACK: Cross-reference SA Directories (Brabys, Yellosa, Infoisinfo) for landlines and general info.

DATA INTEGRITY (ANTI-BOUNCE):
- REAL DATA ONLY: Do not invent names or guess email patterns (e.g. info@...).
- NULL MANDATE: If data is not explicitly found after deep sitemap and identity lookups, return null.

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
  "minedServiceWording": "TECHNICAL SUMMARY MINED FROM SERVICE PAGES (300 WORDS)."
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

            toast({ title: "V8 Hunt Prompt Ready", description: "Broad search and sitemap mandate active. Paste into AI Studio." });
            
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
                            Industrial Gap-Analysis V8
                        </DialogTitle>
                        <DialogDescription className="text-left text-foreground">
                            Generate an aggressive scavenger command for <strong>{companyName}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4 text-left text-foreground">
                        <Alert className="bg-primary/5 border-primary/20 text-left">
                            <Zap className="h-4 w-4 text-primary" />
                            <AlertTitle className="text-left font-bold text-foreground">V8 Scavenger Logic Active</AlertTitle>
                            <AlertDescription className="text-xs text-left text-foreground">
                                This command uses broad search queries to identify the domain first, then enforces a deep crawl of sitemap sub-pages for employee lists before resolving identities on social platforms.
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
                            {isCopied ? 'V8 Command Ready!' : 'Copy V8 Scavenger Prompt'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
