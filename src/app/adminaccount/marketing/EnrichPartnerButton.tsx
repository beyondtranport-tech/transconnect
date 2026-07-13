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

TASK: Discover and bridge ALL data gaps for the SOUTH AFRICAN operations of record "${partner.id}".

STRICT REGIONAL LOCK: 
Ignore all international results (Australia, UK, etc). Target ONLY South African entities and contacts.

STRICT DUAL-IDENTITY PROTOCOL:
1. MARKETING MANAGER: Discover full name, direct professional email, and direct mobile.
2. CEO / MD / OWNER: Discover full name, direct professional email, and direct mobile.

CONTENT MINING MANDATE:
1. SITE MAP CONTENT: Extract the FIRST 300 WORDS of verbatim technical copy found across the official website or business snippets. Focus on "About Us", "Services", and "Product Range".

REQUIRED JSON FORMAT:
{
  "record_id": "${partner.id}",
  "companyName": "${companyName}",
  "industrial_category": "...",
  "website": "OFFICIAL URL",
  "email": "Primary Professional Email",
  "phone": "Company Landline (Main Number)",
  "address": "FULL PHYSICAL ADDRESS IN SOUTH AFRICA",
  "marketingManager": { "name": "...", "email": "...", "mobile": "..." },
  "ceo": { "name": "...", "email": "...", "mobile": "..." },
  "minedServiceWording": "CONCATENATED RAW TEXT (APPROX 300 WORDS)"
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

            toast({ title: "Forensic Prompt Ready", description: "Oversight timeline updated with South African Lock." });
            
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
                <DialogContent className="sm:max-w-xl text-left text-foreground">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-left text-foreground">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Forensic Gap-Analysis (RSA Lock)
                        </DialogTitle>
                        <DialogDescription className="text-left text-foreground">
                            Command the AI to bridge missing data for <strong>{companyName}</strong> specifically within the South African region.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4 text-left text-foreground">
                        <Alert className="bg-primary/5 border-primary/20 text-left">
                            <Zap className="h-4 w-4 text-primary" />
                            <AlertTitle className="text-left font-bold">Regional Lock Active</AlertTitle>
                            <AlertDescription className="text-xs text-left">
                                This prompt mandates the AI to ignore all non-RSA entities, preventing international data leaks.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2 text-left">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Forensic Command Preview</label>
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
                            {isCopied ? 'Prompt Ready!' : 'Copy Prompt (South Africa Lock)'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}