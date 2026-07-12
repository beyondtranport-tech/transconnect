'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Info, Zap, Search } from 'lucide-react';
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
        const currentData = {
            companyName: companyName,
            industrial_category: partner.industrial_category || partner.category || 'General',
            contactPerson: partner.contactPerson || 'Unknown',
            email: partner.email || 'Missing',
            phone: partner.phone || 'Missing',
            mobile: partner.mobile || 'Missing',
            website: partner.website || 'Missing',
            address: partner.address || 'Missing'
        };

        const gaps = Object.entries(currentData)
            .filter(([_, v]) => v === 'Missing' || v === 'Unknown' || (typeof v === 'string' && v.includes('Locked')))
            .map(([k]) => k);

        return `ACT AS AN ELITE CORPORATE FORENSIC INTELLIGENCE AGENT. 
RETURN ONLY A RAW JSON OBJECT. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION.

CRITICAL INTEGRITY SHIELD: 
DO NOT RETURN MOCK, SYNTHETIC, OR PLACEHOLDER DATA. 
YOU MUST PERFORM A LIVE SEARCH FOR "${companyName} South Africa" on Google, LinkedIn, Facebook, and industrial directories (Yellosa, Yandex, Infoisinfo).
SEARCH SPECIFICALLY FOR Variations: e.g. "TGD" if name is "Trans-Gauteng Diesel".

TASK: Discover and bridge ALL data gaps for record "${partner.id}".

FORENSIC PROTOCOL:
1. DISCOVER OFFICIAL WEBSITE: Find the OFFICIAL CORPORATE DOMAIN (e.g. www.companyname.co.za). If missing, crawl verified social pages.
2. VERBATIM SITEMAP MINING: Extract and concatenate the first 300 words of real-world data from the Home, About, and Services sections.
3. IDENTIFY LEADERSHIP: Find the ACTUAL NAME (First and Last) of the CEO, MD, or Owner.
4. MAP CONTACTS: Identify professional email and direct mobile numbers (+27 format). Prioritize any verified number found in search snippets.

REQUIRED FORMAT:
{
  "record_id": "${partner.id}",
  "companyName": "${companyName}",
  "industrial_category": "...",
  "contactPerson": "FULL HUMAN NAME",
  "email": "...",
  "phone": "Verified Landline",
  "mobile": "VERIFIED DIRECT CELL",
  "website": "OFFICIAL CORPORATE URL",
  "address": "FULL VERIFIED PHYSICAL ADDRESS",
  "minedServiceWording": "FULL CONCATENATED RAW TEXT FROM SITE HERO SECTIONS AND SNIPPETS"
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

            toast({ title: "Forensic Command Ready", description: "Oversight timeline updated automatically." });
            
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
                        <DialogTitle className="flex items-center gap-2 text-left">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Forensic Gap-Analysis
                        </DialogTitle>
                        <DialogDescription className="text-left text-foreground text-left">
                            Command the AI to bridge missing data for <strong>{companyName}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4 text-left text-foreground">
                        <Alert className="bg-primary/5 border-primary/20 text-left">
                            <Zap className="h-4 w-4 text-primary" />
                            <AlertTitle className="text-left font-bold text-foreground">Multi-Source Scavenging</AlertTitle>
                            <AlertDescription className="text-xs text-left text-foreground">
                                This prompt now explicitly targets social media and industrial directories to ensure high-fidelity results for entities without traditional websites.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2 text-left">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-left">Forensic Command Preview</label>
                            <ScrollArea className="h-48 w-full border rounded-md p-3 bg-muted/30 text-foreground text-left">
                                <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed text-left">{getPrompt()}</pre>
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
                            {isCopied ? 'Prompt Ready!' : 'Copy Forensic Prompt & Start Logging'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
