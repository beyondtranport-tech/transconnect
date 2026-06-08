
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Copy, ClipboardCheck, Info, Zap, Search } from 'lucide-react';
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

    const companyName = partner.companyName || partner.trading_name || `${partner.firstName} ${partner.lastName}`;
    const isNCR = partner.record_id?.startsWith('NCR_') || !!partner.registration_date;
    const isDriver = partner.type === 'driver' || partner.role === 'Drivers';

    const getPrompt = () => {
        if (isDriver) {
            return `CRITICAL SYSTEM INSTRUCTION: RETURN ONLY A RAW JSON OBJECT. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION.

ACT AS AN ELITE WORKFORCE INTELLIGENCE AGENT. YOUR MISSION IS TO VERIFY THE PROFESSIONAL STANDING OF A HEAVY VEHICLE OPERATOR.

TARGET ENTITY: 
- Service Handle: ${partner.service_handle || `${partner.firstName} ${partner.lastName}`}
- Role Category: ${partner.entryType || 'Code 14 Heavy'}
- Listed Registry Line: ${partner.phone || partner.registry_line || 'N/A'}

INVESTIGATIVE STRATEGY (DRIVER VERIFICATION):
1. SOCIAL FOOTPRINT: Find this driver's professional profile on LinkedIn or Facebook Logistics Groups.
2. IDENTITY AUDIT: Determine their current employment status and verifiable years of experience.
3. CONTACT FORENSICS: Find a verified direct email address and a secondary mobile number.
4. CERTIFICATION SIGNALS: Search for mentions of PrDP, Hazmat, or specific vehicle make expertise (e.g. Scania, Volvo).
5. IDENTITY PERSISTENCE: You MUST return "record_id": "${partner.id}".

REQUIRED OUTPUT FORMAT (RAW JSON ONLY):
{
  "record_id": "${partner.id}",
  "firstName": "...",
  "lastName": "...",
  "email": "Verified Direct Email",
  "phone": "Verified Mobile",
  "notes": "Detailed summary of experience and certifications found",
  "address": "Primary operational region",
  "research_status": "completed"
}`;
        }

        if (isNCR) {
            return `CRITICAL SYSTEM INSTRUCTION: RETURN ONLY A RAW JSON OBJECT. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION.

ACT AS AN ELITE CORPORATE INTELLIGENCE AGENT. THIS ENTITY IS REGISTERED WITH THE NATIONAL CREDIT REGULATOR (NCR).

TASK: Perform Phase 2 Enrichment for the following NCR-registered business.

TARGET ENTITY: 
- Legal Name: ${partner.companyName}
- Trading Name: ${partner.trading_name || 'N/A'}
- NCR Reg Date: ${partner.registration_date || 'N/A'}

INVESTIGATIVE STRATEGY (PHASE 2: ACTIVITY & LEADERSHIP):
1. OFFICIAL FOOTPRINT: Find this company's official website and LinkedIn page.
2. HUMAN IDENTITY: Identify the ACTUAL NAME (First and Last) of the CEO, Managing Director, or Head of Credit. 
3. PRODUCT INTELLIGENCE: Analyze their business activities and identify which agreement types they offer: [Loans, Installment Sale, Lease, Factoring].
4. CATEGORIZATION: Based on their activity, assign them to: [Banks, Government, AEO, Niche Lenders].
5. IDENTITY PERSISTENCE: You MUST return "record_id": "${partner.id}".

REQUIRED OUTPUT FORMAT (RAW JSON ONLY):
{
  "record_id": "${partner.id}",
  "website": "URL",
  "contact_person": "ACTUAL HUMAN FULL NAME",
  "email_address": "Verified Direct Email",
  "business_activity": "Detailed Summary of Services",
  "agreement_types": ["List of types found"],
  "entryType": "Refined Category from list above",
  "research_status": "completed"
}`;
        }

        return `CRITICAL SYSTEM INSTRUCTION: RETURN ONLY A RAW JSON OBJECT. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION. NO EXPLANATORY TEXT.

ACT AS AN ELITE CORPORATE INTELLIGENCE AGENT. YOUR PRIMARY MISSION IS TO IDENTIFY ACTUAL HUMAN BEINGS IN LEADERSHIP.

TASK: Find CURRENT verified public contact and SPECIFIC human leadership details for the following South African business.

INVESTIGATIVE STRATEGY:
1. HUMAN IDENTITY FIRST: You must find the ACTUAL NAME (First and Last) of the CEO, Managing Director, or Owner. 
2. FORBIDDEN VALUES: Returning "The Director", "The Manager", "Managing Director", or "Unknown" is a FAILURE. You MUST hunt LinkedIn profiles or "About Us" pages to find a specific human name (e.g. "Sipho Nkosi").
3. PROACTIVE EMAIL SEARCH: Identify the corporate domain and look for verified "info@", "sales@", or "admin@" formats if direct personal emails are hidden.
4. IDENTITY PERSISTENCE: You MUST return the "record_id": "${partner.id}" exactly as provided.

REQUIRED OUTPUT FORMAT (RAW JSON ONLY):
{
  "record_id": "${partner.id}",
  "company_name": "${companyName}",
  "contact_person": "ACTUAL HUMAN FULL NAME (NOT A TITLE)",
  "email_address": "Verified Email",
  "telephone_number": "Phone Number",
  "website": "URL",
  "physical_address": "Full Physical Address"
}`;
    };

    const aiPrompt = getPrompt();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(aiPrompt);
            setIsCopied(true);
            toast({ title: "Forensic Prompt Copied!", description: isDriver ? "AI will now hunt for driver experience and contacts." : "AI will now hunt for leadership identities." });
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

            toast({ title: "Status Updated", description: "Record is now locked in the 'Searching' queue." });
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
                title="Generate Forensic Prompt"
            >
                <Search className="h-4 w-4 text-primary" />
            </Button>

            <Dialog open={isOpen} onOpenChange={(o) => !isLogging && setIsOpen(o)}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            {isDriver ? 'Workforce Forensics' : (isNCR ? 'Phase 2: Forensic Enrichment' : 'Forensic Individual AI Research')}
                        </DialogTitle>
                        <DialogDescription>
                            {isDriver 
                                ? `Generate a deep-search prompt to verify experience and find contacts for: ${partner.service_handle || partner.firstName}`
                                : (isNCR 
                                    ? `Determine the business activity and leadership for NCR record: ${companyName}`
                                    : `Generate a deep-search prompt optimized to find actual human leadership names for ${companyName}.`)}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <Alert className="bg-primary/5 border-primary/20">
                            <Info className="h-4 w-4 text-primary" />
                            <AlertTitle>{isDriver ? 'Driver Verification Active' : (isNCR ? 'ActivityPass Active' : 'Anti-Placeholder Command Active')}</AlertTitle>
                            <AlertDescription className="text-xs text-muted-foreground">
                                {isDriver 
                                    ? "The AI is instructed to cross-reference logistics groups and professional resumes to find direct contacts and specific make/model expertise."
                                    : (isNCR 
                                        ? "The AI is instructed to find agreement types (Loan, Lease, etc.) and identify the specific human credit decision-maker."
                                        : "This prompt strictly forbids the AI from returning titles like \"The Director\" and commands it to hunt for verified human identities.")}
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">AI Forensic Command</label>
                            <ScrollArea className="h-48 w-full border rounded-md p-3 bg-muted/30 text-foreground">
                                <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed">{aiPrompt}</pre>
                            </ScrollArea>
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-between gap-4">
                        <Button variant="outline" onClick={handleCopy}>
                            <Copy className="mr-2 h-4 w-4" /> 
                            {isCopied ? 'Copied!' : 'Copy Forensic Prompt'}
                        </Button>
                        <Button onClick={handleMarkAsResearching} disabled={isLogging || !isCopied} className="bg-primary hover:bg-primary/90 text-white">
                            {isLogging ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Zap className="mr-2 h-4 w-4" />}
                            Mark as Searching
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export function BulkEnrichButton({ partners, onComplete }: { partners: any[], onComplete: () => void }) {
    const [open, setOpen] = useState(false);
    const selectedPartners = useMemo(() => {
        return partners.filter(p => (!p.email || p.email === 'null') || p.researchStatus === 'researching').slice(0, 10);
    }, [partners]);

    return (
        <BatchResearchDialog 
            open={open} 
            onOpenChange={setOpen} 
            selectedLeads={selectedPartners} 
            onComplete={onComplete} 
        />
    );
}
