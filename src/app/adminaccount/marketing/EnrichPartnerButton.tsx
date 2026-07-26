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
        return `ACT AS AN ELITE SOUTH AFRICAN INDUSTRIAL RESEARCH AGENT (V12 - FORENSIC SCAVENGER).
        
TASK: Bridge ALL data gaps for: "${companyName}". Use an aggressive, inductive reconstruction approach.

INVESTIGATION MANDATE:
1. ACRONYM EXPANSION: If the name is initials (e.g. "JH"), you MUST first determine what it stands for (e.g. "Junior H").
2. FRAGMENT STITCHING: You are expected to combine fragments from different snippets. Take the address from a directory, the email from a LinkedIn bio, and the phone from a Facebook page.
3. FLAT-SITE RESILIENCY: Industrial sites like "jhtrucking.co.za" are often one-page. Analyze snippets for "Contact Cards", "Sections", and "Footer blocks" instead of sub-URLs.
4. IDENTITY RESOLUTION: Find the CEO and Marketing Lead. Pivot to social platforms (LinkedIn/Facebook) to resolve direct professional contact detail.
5. AGGREGATOR TRUST: Use SA directories (Yellosa, Brabys, Infoisinfo) to populate fields if the official site is sparse.

RETURN ONLY A RAW JSON OBJECT. NO MARKDOWN. NO CODE BLOCKS. NO PREAMBLE.

{
  "record_id": "${partner.id}",
  "companyName": "FULL REGISTERED NAME",
  "industrial_category": "Refined Category",
  "website": "VERIFIED URL",
  "email": "VERIFIED GENERAL EMAIL",
  "phone": "RSA LANDLINE",
  "address": "VERIFIED PHYSICAL ADDRESS",
  "marketingManager": { 
      "name": "VERIFIED NAME", 
      "email": "VERIFIED EMAIL", 
      "mobile": "VERIFIED MOBILE" 
  },
  "ceo": { 
      "name": "VERIFIED NAME", 
      "email": "VERIFIED EMAIL", 
      "mobile": "VERIFIED MOBILE" 
  },
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

            toast({ title: "V12 Scavenger Prompt Ready", description: "Inductive reconstruction protocol active. Paste into AI Studio." });
            
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
                            Industrial Gap-Analysis V12
                        </DialogTitle>
                        <DialogDescription className="text-left text-foreground text-foreground text-foreground text-foreground">
                            Generate an aggressive V12 scavenger command for <strong>{companyName}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4 text-left text-foreground text-foreground text-foreground">
                        <Alert className="bg-primary/5 border-primary/20 text-left text-foreground text-foreground text-foreground">
                            <Zap className="h-4 w-4 text-primary" />
                            <AlertTitle className="text-left font-bold text-foreground text-left text-foreground text-foreground">Inductive Reconstruction Active</AlertTitle>
                            <AlertDescription className="text-xs text-left text-foreground text-foreground">
                                V12 protocol: Commands the AI to stitch together data fragments from across the web, specifically targeting "flat" industrial sites and acronyms.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2 text-left text-foreground text-foreground text-foreground">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 text-foreground">AI Research Command</label>
                            <ScrollArea className="h-48 w-full border rounded-md p-3 bg-muted/30 text-left text-foreground">
                                <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed text-foreground text-foreground">{getPrompt()}</pre>
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
                            {isCopied ? 'V12 Command Ready!' : 'Copy V12 Scavenger Prompt'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
