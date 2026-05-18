'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { enrichPartner } from '@/ai/flows/enrich-partner-flow';
import { getClientSideAuthToken } from '@/firebase';

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
    const [isEnriching, setIsEnriching] = useState(false);
    const { toast } = useToast();

    const handleEnrich = async () => {
        setIsEnriching(true);
        try {
            const result = await enrichPartner({
                companyName: partner.companyName || `${partner.firstName} ${partner.lastName}`,
                contactPerson: partner.firstName === 'Member' ? undefined : `${partner.firstName} ${partner.lastName}`,
            });

            if (!result || (!result.email && !result.phone && !result.website && !result.address && !result.contactPerson)) {
                toast({
                    variant: 'destructive',
                    title: "Research Unsuccessful",
                    description: "The AI agent searched but couldn't find verifiable details. Ensure your Search Engine is set to 'Search the entire web'.",
                });
                return;
            }

            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            const dataToUpdate: any = {};
            if (!partner.email && result.email) dataToUpdate.email = result.email;
            if (!partner.phone && result.phone) dataToUpdate.phone = result.phone;
            if (!partner.website && result.website) dataToUpdate.website = result.website;
            if (!partner.address && result.address) dataToUpdate.address = result.address;
            
            if (result.contactPerson && (!partner.firstName || partner.firstName === 'Member' || partner.firstName === '')) {
                const parts = result.contactPerson.split(' ');
                dataToUpdate.firstName = parts[0];
                dataToUpdate.lastName = parts.slice(1).join(' ') || 'Candidate';
            }

            if (Object.keys(dataToUpdate).length === 0) {
                 toast({
                    title: "No New Data",
                    description: "Found info matched existing record. No updates needed.",
                });
                return;
            }

            await performAdminAction(token, 'savePartner', { partner: { id: partner.id, ...dataToUpdate } });

            toast({
                title: "Enrichment Successful",
                description: `Updated details for ${partner.companyName || 'this partner'}.`,
            });
            onUpdate();
        } catch (e: any) {
            console.error("Enrichment UI Error:", e);
            const errorMessage = e.message || "";
            
            let displayTitle = "Enrichment Failed";
            let displayMessage = errorMessage;

            if (errorMessage.includes('CONFIG_ERROR')) {
                displayTitle = "Configuration Issue";
                displayMessage = errorMessage.split('CONFIG_ERROR:')[1].trim();
            } else if (errorMessage.includes('API_ERROR')) {
                displayTitle = "Google API Error";
                displayMessage = errorMessage.split('API_ERROR:')[1].trim();
            } else if (errorMessage.includes('SEARCH_TIMEOUT')) {
                displayMessage = "Search timed out. Please try again.";
            }

            toast({ 
                variant: 'destructive', 
                title: displayTitle, 
                description: displayMessage
            });
        } finally {
            setIsEnriching(false);
        }
    };

    return (
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleEnrich} 
            disabled={isEnriching}
            title="AI Research & Enrich"
        >
            {isEnriching ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Sparkles className="h-4 w-4 text-primary" />}
        </Button>
    );
}

export function BulkEnrichButton({ partners, onComplete }: { partners: any[], onComplete: () => void }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const { toast } = useToast();

    const handleBulkEnrich = async () => {
        const targets = partners.filter(p => !p.email || !p.website || !p.phone || !p.address);
        if (targets.length === 0) {
            toast({ title: "All records are already enriched." });
            return;
        }

        setIsProcessing(true);
        let successCount = 0;
        
        for (let i = 0; i < targets.length; i++) {
            const partner = targets[i];
            try {
                const result = await enrichPartner({
                    companyName: partner.companyName || `${partner.firstName} ${partner.lastName}`,
                });
                
                const dataToUpdate: any = {};
                if (!partner.email && result.email) dataToUpdate.email = result.email;
                if (!partner.website && result.website) dataToUpdate.website = result.website;
                if (!partner.phone && result.phone) dataToUpdate.phone = result.phone;
                if (!partner.address && result.address) dataToUpdate.address = result.address;

                if (Object.keys(dataToUpdate).length > 0) {
                    const token = await getClientSideAuthToken();
                    if (token) {
                        await performAdminAction(token, 'savePartner', { partner: { id: partner.id, ...dataToUpdate } });
                        successCount++;
                    }
                }
            } catch (e: any) {
                if (e.message.includes('CONFIG_ERROR')) {
                    toast({ variant: 'destructive', title: "Config Error", description: e.message });
                    break;
                }
            }
            setProgress(Math.round(((i + 1) / targets.length) * 100));
        }

        toast({ title: "Bulk Research Finished", description: `Updated ${successCount} records.` });
        setIsProcessing(false);
        setProgress(0);
        onComplete();
    };

    return (
        <Button variant="outline" size="sm" onClick={handleBulkEnrich} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
            {isProcessing ? `Researching ${progress}%` : 'Bulk AI Research'}
        </Button>
    );
}