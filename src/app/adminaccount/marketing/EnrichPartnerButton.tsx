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

    const aiPrompt = `I need you to act as a precision research agent. Your task is to find the current contact and management details for the following South African company.

RESEARCH STRATEGY:
1. Search extensively across LinkedIn, Facebook, X (Twitter), and Instagram for official business pages.
2. Check top regional directories: YellowPages.co.za, Brabys.com, EasyInfo.co.za, Snupit.co.za, and Cylex.net.za.
3. Look for professional email addresses. If not found, look for generic ones (info@, sales@, admin@) or personal management addresses found on social profiles.
4. Identify the name of a key decision-maker (Owner, Director, Manager, or Fleet Manager).

OUTPUT FORMAT:
Provide the output ONLY as a clean JSON object. DO NOT include conversational text.

{
  "company_name": "${companyName}",
  "contact_person": "Full Name",
  "email_address": "Verifiable address",
  "telephone_number": "Local SA format",
  "website": "Primary domain",
  "physical_address": "Full street address"
}

If a field is not found after deep searching, use null. DO NOT hallucinate.

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

            toast({ title: "Status Updated", description: "Record is now in the 'Researching' queue." });
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
                            AI Research Assistant
                        </DialogTitle>
                        <DialogDescription>
                            Generate a deep-search prompt for <strong>{companyName}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <Alert className="bg-primary/5 border-primary/20">
                            <Info className="h-4 w-4 text-primary" />
                            <AlertTitle>Manual Research Flow</AlertTitle>
                            <AlertDescription>
                                Copy the prompt, paste it into Google AI, and then use the <strong>Bulk Import</strong> tool to update this record.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">High-Precision Prompt</label>
                            <ScrollArea className="h-48 w-full border rounded-md p-3 bg-muted/30 text-foreground">
                                <pre className="text-xs whitespace-pre-wrap font-sans">{aiPrompt}</pre>
                            </ScrollArea>
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-between gap-4">
                        <Button variant="outline" onClick={handleCopy}>
                            <Copy className="mr-2 h-4 w-4" /> {isCopied ? 'Copied!' : 'Copy Prompt'}
                        </Button>
                        <Button onClick={handleMarkAsResearching} disabled={isLogging || !isCopied} className="bg-primary hover:bg-primary/90 text-white">
                            {isLogging ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ClipboardCheck className="mr-2 h-4 w-4" />}
                            Mark as Researching
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