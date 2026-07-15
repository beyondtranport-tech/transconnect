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
        return `ACT AS AN ELITE INDUSTRIAL RESEARCH AGENT. 
YOU MUST RETURN ONLY A RAW JSON OBJECT. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION.

TASK: Discover and bridge ALL data gaps for the SOUTH AFRICAN operations of: "${companyName}".

NOISE SUPPRESSION:
1. Ignore all job listings, LinkedIn job pings, and news articles.
2. Focus entirely on corporate landing pages and business directories (e.g. Yellosa, Infoisinfo).
3. Do not apologize or explain your research.

REQUIRED JSON FORMAT:
{
  "record_id": "${partner.id}",
  "companyName": "${companyName}",
  "industrial_category": "...",
  "website": "...",
  "email": "Primary Email",
  "phone": "RSA Landline",
  "address": "Verified Physical Address",
  "marketingManager": { "name": "...", "email": "...", "mobile": "..." },
  "ceo": { "name": "...", "email": "...", "mobile": "..." },
  "minedServiceWording": "CONCATENATED RAW SITE TEXT (300 WORDS)"
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

            toast({ title: "Prompt Ready", description: "Mandatory JSON mode active. Use tools to bridge gaps." });
            
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
                            Noise-suppressed command for <strong>{companyName}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4 text-left text-foreground">
                        <Alert className="bg-primary/5 border-primary/20 text-left">
                            <Zap className="h-4 w-4 text-primary" />
                            <AlertTitle className="text-left font-bold text-foreground">Extraction Mandate</AlertTitle>
                            <AlertDescription className="text-xs text-left text-foreground">
                                This prompt forces the AI to output RAW JSON. Paste this into AI Studio to initiate the research cycle.
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
