
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

ACT AS AN ELITE WORKFORCE INTELLIGENCE AGENT. YOUR MISSION IS TO LOCATE DIRECT DIGITAL CONTACT CHANNELS FOR A HEAVY VEHICLE OPERATOR.

TARGET ENTITY: 
- Name/Handle: ${partner.service_handle || `${partner.firstName} ${partner.lastName}`}
- Category: ${partner.entryType || partner.service_classification || 'Code 14 Heavy'}
- Known Registry Line: ${partner.phone || partner.registry_line || 'N/A'} (Note: This may be a landline/switchboard).
- Experience Profile: ${partner.notes || partner.capability_profile || 'N/A'}

INVESTIGATIVE STRATEGY (DIRECT CONTACT ENRICHMENT):
1. SOCIAL CLUSTER SEARCH: Cross-reference this driver's name and hub (${partner.address || partner.operational_hub}) in LinkedIn and Facebook South African Trucking groups.
2. MOBILE IDENTIFICATION: Locate a verified direct mobile/cell number (+27 7... or +27 8...). A landline is unacceptable for the 'mobile' field.
3. EMAIL DISCOVERY: Find a personal or professional email address (e.g. Gmail, Outlook, or Company domain). 
4. IDENTITY PERSISTENCE: You MUST return "record_id": "${partner.id}".

REQUIRED OUTPUT FORMAT (RAW JSON ONLY):
{
  "record_id": "${partner.id}",
  "firstName": "...",
  "lastName": "...",
  "email": "Verified Direct Email",
  "phone": "Work Landline Number",
  "mobile": "Verified DIRECT MOBILE Number (e.g. +27 72...)",
  "notes": "Consolidated profile including verified certs (PrDP, Hazmat) and years of experience",
  "address": "Primary Hub/Region",
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
  "email": "Verified Direct Email",
  "phone": "Work Landline",
  "mobile": "Direct Mobile Number",
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
3. CONTACT DIFFERENTIATION: You MUST find both the company Landline (Phone) and the decision-maker's Direct Cell (Mobile).
4. IDENTITY PERSISTENCE: You MUST return the "record_id": "${partner.id}" exactly as provided.

REQUIRED OUTPUT FORMAT (RAW JSON ONLY):
{
  "record_id": "${partner.id}",
  "companyName": "${companyName}",
  "contactPerson": "ACTUAL HUMAN FULL NAME (NOT A TITLE)",
  "email": "Verified Email",
  "phone": "Work Landline Number",
  "mobile": "Verified DIRECT MOBILE/CELL Number (e.g. +27 82...)",
  "website": "URL",
  "address": "Full Physical Address"
}`;
    };

    const aiPrompt = getPrompt();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(aiPrompt);
            setIsCopied(true);
            toast({ title: "Forensic Prompt Copied!", description: isDriver ? "AI will now hunt for direct mobile and email contacts." : "AI will now hunt for leadership and direct contacts." });
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
                            {isDriver ? 'Workforce Direct-Contact Forensics' : (isNCR ? 'Phase 2: Forensic Enrichment' : 'Forensic Individual AI Research')}
                        </DialogTitle>
                        <DialogDescription>
                            {isDriver 
                                ? `Identify direct digital contact channels (Mobile & Email) for: ${partner.service_handle || partner.firstName}`
                                : (isNCR 
                                    ? `Determine the business activity and leadership for NCR record: ${companyName}`
                                    : `Generate a deep-search prompt optimized to find human leadership and direct mobile contacts for ${companyName}.`)}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <Alert className="bg-primary/5 border-primary/20">
                            <Info className="h-4 w-4 text-primary" />
                            <AlertTitle>{isDriver ? 'Mobile Discovery Active' : (isNCR ? 'ActivityPass Active' : 'Direct Contact Command Active')}</AlertTitle>
                            <AlertDescription className="text-xs text-muted-foreground">
                                {isDriver 
                                    ? "The AI is strictly commanded to find a direct mobile number (+27 7... or +27 8...) and a personal/professional email, bypassing the provided landline."
                                    : (isNCR 
                                        ? "The AI is instructed to find agreement types and identify the specific human credit decision-maker."
                                        : "This prompt explicitly commands the AI to differentiate between the general business landline and the direct mobile number of the leadership.")}
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

function BatchResearchDialog({ open, onOpenChange, selectedLeads, onComplete }: any) {
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const { toast } = useToast();

    const companyList = selectedLeads.map((l: any) => `[ID: ${l.id}] ${l.companyName || l.service_handle}`).join('\n');
    
    const aiPrompt = `CRITICAL SYSTEM INSTRUCTION: RETURN ONLY A RAW JSON ARRAY. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION.

ACT AS AN ELITE CORPORATE INTELLIGENCE AGENT. 

TASK: Find CURRENT verified leadership and direct digital contact details for the following South African entities.

INVESTIGATIVE STRATEGY:
1. HUMAN IDENTITY: You MUST find the ACTUAL NAME of the CEO, MD, or Owner. 
2. CONTACT DIFFERENTIATION: Differentiate between "phone" (Work Landline) and "mobile" (Direct Cell +27...).
3. IDENTITY PERSISTENCE: You MUST return the "record_id" exactly as provided.

REQUIRED OUTPUT FORMAT (RAW JSON ARRAY ONLY):
[{"record_id":"...","companyName":"...","contactPerson":"FULL NAME","email":"...","phone":"Landline","mobile":"Direct Cell","website":"...","address":"..."}]

ENTITIES TO RESEARCH:
${companyList}`;

    const handleCopyAll = async () => {
        try {
            await navigator.clipboard.writeText(aiPrompt);
            setIsCopied(true);
            toast({ title: "Batch Prompt Copied!" });
        } catch (e) {
            toast({ variant: 'destructive', title: "Copy Failed" });
        }
    };

    const handleMarkAsResearching = async () => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed");
            const leadIds = selectedLeads.map((l: any) => l.id);
            await performAdminAction(token, 'markLeadsAsResearching', { leadIds });
            toast({ title: "Batch Marked as Searching" });
            onComplete();
            onOpenChange(false);
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Update Failed", description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Batch Forensic Enrichment ({selectedLeads.length})</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <ScrollArea className="h-64 border rounded-md p-4 bg-muted/30">
                        <pre className="text-[10px] font-mono whitespace-pre-wrap">{aiPrompt}</pre>
                    </ScrollArea>
                </div>
                <DialogFooter className="sm:justify-between">
                    <Button variant="outline" onClick={handleCopyAll}>
                        <Copy className="mr-2 h-4 w-4" /> Copy Prompt
                    </Button>
                    <Button onClick={handleMarkAsResearching} disabled={isLoading || !isCopied}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Zap className="mr-2 h-4 w-4" />}
                        Mark as Searching
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
