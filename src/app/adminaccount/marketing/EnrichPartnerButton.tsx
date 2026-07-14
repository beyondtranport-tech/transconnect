'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Info, Zap, Search, ClipboardCheck, AlertTriangle } from 'lucide-react';
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
        return `ACT AS AN ELITE SOUTH AFRICAN INDUSTRIAL RESEARCH AGENT. 
RETURN ONLY A RAW JSON OBJECT. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION.

NOISE SUPPRESSION PROTOCOL:
1. IGNORE ALL JOB LISTINGS, POLICY NEWS, AND NEWS ARTICLES.
2. FOCUS ONLY ON CORPORATE LANDING PAGES AND BUSINESS DIRECTORIES.

CRITICAL INTEGRITY SHIELD: 
YOU ARE STRICTLY FORBIDDEN FROM RETURNING MOCK DATA. IF DATA IS NOT DISCOVERED, RETURN null.

TASK: Discover and bridge ALL data gaps for the SOUTH AFRICAN operations of: "${companyName}".

STRICT REGIONAL LOCK: 
Ignore all international results. Target ONLY South African entities and contacts.

STRICT DUAL-IDENTITY PROTOCOL:
1. MARKETING MANAGER: Discover full name, direct professional email, and direct mobile.
2. CEO / MD / OWNER: Discover full name, direct professional email, and direct mobile.

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
        if (!partner.id) {
            toast({ variant: 'destructive', title: 'Invalid Record', description: 'Missing record ID.' });
            return;
        }

        setIsLogging(true);
        try {
            await navigator.clipboard.writeText(getPrompt());
            setIsCopied(true);

            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Session expired. Please sign in again.");

            await performAdminAction(token, 'logForensicInitiated', { 
                partnerId: partner.id,
                isLead: !partner.type || partner.type === 'lead'
            });

            toast({ title: "Prompt Ready", description: "Noise suppression active. Scavenger mandate launched." });
            
            setTimeout(() => {
                setIsOpen(false);
                onUpdate();
            }, 1000);

        } catch (e: any) {
            console.error("Enrichment failure:", e);
            toast({ 
                variant: 'destructive', 
                title: "Automation Failed", 
                description: e.message || "Failed to reach the server." 
            });
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
                            Industrial Gap-Analysis V4
                        </DialogTitle>
                        <DialogDescription className="text-left text-foreground">
                            Clinical noise-suppressed research for <strong>{companyName}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4 text-left text-foreground">
                        <Alert className="bg-primary/5 border-primary/20 text-left">
                            <Zap className="h-4 w-4 text-primary" />
                            <AlertTitle className="text-left font-bold text-foreground">Noise Suppression Active</AlertTitle>
                            <AlertDescription className="text-xs text-left text-foreground">
                                This command forces the AI to ignore news and job listings, focusing entirely on corporate contact nodes.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2 text-left">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">AI Research Command</label>
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
                            {isCopied ? 'Command Ready!' : 'Copy Research Prompt'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}