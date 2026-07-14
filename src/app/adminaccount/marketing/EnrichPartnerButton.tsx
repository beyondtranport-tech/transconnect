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

    const companyName = partner.companyName || partner.trading_name || `${partner.firstName} ${partner.lastName}`;

    const getPrompt = () => {
        return `ACT AS AN ELITE SOUTH AFRICAN CORPORATE FORENSIC INTELLIGENCE AGENT. 
RETURN ONLY A RAW JSON OBJECT. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION.

CRITICAL INTEGRITY SHIELD: 
YOU ARE STRICTLY FORBIDDEN FROM RETURNING MOCK OR SYNTHETIC DATA. IF DATA IS NOT DISCOVERED VIA SEARCH, RETURN null.

TASK: Discover and bridge ALL data gaps for the SOUTH AFRICAN operations of record "${partner.id}".

STRICT REGIONAL LOCK: 
Ignore all international results. Target ONLY South African entities and contacts.

STRICT DUAL-IDENTITY PROTOCOL:
1. MARKETING MANAGER: Discover full name, direct professional email, and direct mobile.
2. CEO / MD / OWNER: Discover full name, direct professional email, and direct mobile.

SCAVENGER MANDATE:
1. NO "N/A" DEFAULTS: Aggressively search social snippets (Facebook/LinkedIn), directory lists, and CIPC previews.
2. PATTERN INFERENCE: If you find one formatted email (e.g. jdoe@company.co.za) and a leadership name, infer the direct contact if verified by site patterns.

CONTENT MINING MANDATE:
1. SITE MAP CONTENT: Extract the FIRST 300 WORDS of verbatim technical copy found across the official website. Focus on "About Us" and "Services".

REQUIRED JSON FORMAT:
{
  "record_id": "${partner.id}",
  "companyName": "${companyName}",
  "industrial_category": "...",
  "website": "OFFICIAL URL",
  "email": "General Company Email",
  "phone": "Verified RSA Landline",
  "address": "FULL PHYSICAL ADDRESS IN SOUTH AFRICA",
  "marketingManager": { "name": "...", "email": "...", "mobile": "..." },
  "ceo": { "name": "...", "email": "...", "mobile": "..." },
  "minedServiceWording": "CONCATENATED RAW SITE TEXT (APPROX 300 WORDS)"
}`;
    };

    const handleCopyAndLog = async () => {
        setIsLogging(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed");

            await navigator.clipboard.writeText(getPrompt());
            setIsCopied(true);

            await performAdminAction(token, 'logForensicInitiated', { 
                partnerId: partner.id,
                isLead: !partner.type || partner.type === 'lead'
            });

            toast({ title: "Forensic Command Ready", description: "Scavenger mandate active. Oversight timeline updated." });
            
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
                title="Forensic Scavenger"
            >
                <Search className="h-4 w-4 text-primary" />
            </Button>

            <Dialog open={isOpen} onOpenChange={(o) => !isLogging && setIsOpen(o)}>
                <DialogContent className="sm:max-w-xl text-left text-foreground">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-left text-foreground font-black">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Forensic Scavenger V4
                        </DialogTitle>
                        <DialogDescription className="text-left text-foreground">
                            Aggressive gap-analysis for <strong>{companyName}</strong>. Throttling synthetic data to force real-world discovery.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4 text-left text-foreground">
                        <Alert className="bg-primary/5 border-primary/20 text-left">
                            <Zap className="h-4 w-4 text-primary" />
                            <AlertTitle className="text-left font-bold">Integrity Shield Active</AlertTitle>
                            <AlertDescription className="text-xs text-left">
                                This prompt orders the AI to ignore all non-RSA results and scavenge social snippets for direct mobile numbers.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2 text-left">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Forensic Command V4</label>
                            <ScrollArea className="h-48 w-full border rounded-md p-3 bg-muted/30 text-left">
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
                            {isCopied ? 'Command Ready!' : 'Copy Scavenger Prompt'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}