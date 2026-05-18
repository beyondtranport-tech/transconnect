'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
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
        throw new Error(result.error || `API Error for action: ${action}`);
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
                contactPerson: `${partner.firstName} ${partner.lastName}`,
            });

            if (!result.email && !result.phone && !result.website) {
                toast({
                    title: "No new data found",
                    description: "The AI agent couldn't find any additional contact details for this record.",
                });
                return;
            }

            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            const dataToUpdate: any = {};
            if (!partner.email && result.email) dataToUpdate.email = result.email;
            if (!partner.phone && result.phone) dataToUpdate.phone = result.phone;
            if (!partner.website && result.website) dataToUpdate.website = result.website;

            if (Object.keys(dataToUpdate).length === 0) {
                 toast({
                    title: "Data already exists",
                    description: "Found details already match your record.",
                });
                return;
            }

            await performAdminAction(token, 'savePartner', { partner: { id: partner.id, ...dataToUpdate } });

            toast({
                title: "Enrichment Successful",
                description: `Found and updated missing details.`,
            });
            onUpdate();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Enrichment Failed", description: e.message });
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
            title="Enrich with AI Agent"
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
        const targets = partners.filter(p => !p.email || !p.website || !p.phone);
        if (targets.length === 0) {
            toast({ title: "No enrichment needed", description: "All records in this list already have contact details." });
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

                if (Object.keys(dataToUpdate).length > 0) {
                    const token = await getClientSideAuthToken();
                    if (token) {
                        await performAdminAction(token, 'savePartner', { partner: { id: partner.id, ...dataToUpdate } });
                        successCount++;
                    }
                }
                
                // Rate limit protection
                await new Promise(resolve => setTimeout(resolve, 1500));
            } catch (e) {
                console.error(`Failed to enrich ${partner.id}`, e);
            }
            setProgress(Math.round(((i + 1) / targets.length) * 100));
        }

        toast({ title: "Bulk Enrichment Complete", description: `Successfully enriched ${successCount} records.` });
        setIsProcessing(false);
        setProgress(0);
        onComplete();
    };

    return (
        <Button variant="outline" size="sm" onClick={handleBulkEnrich} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
            {isProcessing ? `Enriching ${progress}%` : 'Bulk Enrich Missing Info'}
        </Button>
    );
}
