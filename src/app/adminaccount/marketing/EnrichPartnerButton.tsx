'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Copy, ClipboardCheck, Info } from 'lucide-react';
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
        throw new Error(result.error || `API Error: ${action}`);
    }
    return result;
}

export function EnrichPartnerButton({ partner, onUpdate }: { partner: any, onUpdate: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLogging, setIsLogging] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const { toast } = useToast();

    const companyName = partner.companyName || `${partner.firstName} ${partner.lastName}`;

    const aiPrompt = `STRICT INSTRUCTION: RETURN ONLY A RAW JSON OBJECT. NO CONVERSATIONAL TEXT. NO MARKDOWN.

ACT AS A HIGH-INTELLIGENCE INVESTIGATIVE RESEARCH AGENT. Find CURRENT contact and management details for the following South African company.

INVESTIGATIVE STRATEGY:
1. LEADERSHIP SEARCH: Actively look for the name of the "Managing Director", "Owner", or "Principal".
2. REGISTRY CHECK: Cross-reference with the SARS Carrier/Clearing Database and CIPC records.
3. IDENTITY PERSISTENCE: You MUST return "record_id": "${partner.id}" in your response.

REQUIRED OUTPUT SCHEMA (JSON):
{
  "record_id": "${partner.id}",
  "company_name": "${companyName}",
  "contact_person": "Full Name of Director/Owner",
  "email_address": "Verified Email Address",
  "telephone_number": "Phone Number",
  "website": "URL",
  "physical_address": "Full Physical Address"
}

COMPANY TO RESEARCH:
${companyName}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(aiPrompt);
            setIsCopied(true);
            toast({ title: "Prompt Copied!", description: "Paste this into Google AI to get the data." });
        } catch (e) {
            toast({ variant: 'destructive', title: "Copy Failed" });
        }
    };

    const handleMarkAsResearching = async () => {
        setIsLogging(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed");

            await performAdminAction(token, 'markLeadsAsResearching', { 
                leadIds: [partner.id] 
            });

            toast({ title: "Status Updated", description: "Record is now in the 'Searching' queue." });
            setIsOpen(false);
            onUpdate();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Update Failed", description: e.message });
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
                title="AI Research Prompt"
            >
                <Sparkles className="h-4 w-4 text-primary" />
            </Button>

            <Dialog open={isOpen} onOpenChange={(o) => !isLogging && setIsOpen(o)}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            AI Investigative Assistant
                        </DialogTitle>
                        <DialogDescription>
                            Generate a deep-search prompt for <strong>{companyName}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <Alert className="bg-primary/5 border-primary/20">
                            <Info className="h-4 w-4 text-primary" />
                            <AlertTitle>Deep Search Strategy</AlertTitle>
                            <AlertDescription>
                                This prompt commands the AI to search for Managing Directors and official SARS registries to find details that are often missing from basic snippets.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Investigative Prompt</label>
                            <ScrollArea className="h-48 w-full border rounded-md p-3 bg-muted/30 text-foreground">
                                <pre className="text-xs whitespace-pre-wrap font-sans">{aiPrompt}</pre>
                            </ScrollArea>
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-between gap-4">
                        <Button variant="outline" onClick={handleCopy}>
                            {isCopied ? <ClipboardCheck className="mr-2 h-4 w-4 text-green-600" /> : <Copy className="mr-2 h-4 w-4" />} 
                            {isCopied ? 'Copied!' : 'Copy Prompt'}
                        </Button>
                        <Button onClick={handleMarkAsResearching} disabled={isLogging || !isCopied} className="bg-primary hover:bg-primary/90 text-white">
                            {isLogging ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ClipboardCheck className="mr-2 h-4 w-4" />}
                            Mark as Searching
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export function BulkEnrichButton({ partners, onComplete }: { partners: any[], onComplete: () => void }) {
    return null; 
}