
'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { getClientSideAuthToken } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { PartnerWizard } from '@/app/lending/partner-wizard';

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
    return result.data;
}

function EditPartnerPageContent() {
    const params = useParams();
    const router = useRouter();
    const partnerId = params.partnerId as string;
    const [partner, setPartner] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadPartner = async () => {
            if (!partnerId) return;
            setIsLoading(true);
            try {
                const token = await getClientSideAuthToken();
                if (!token) throw new Error("Auth failed.");
                const data = await performAdminAction(token, 'getLendingData', { collectionName: 'lendingPartners' });
                const foundPartner = data.find((p: any) => p.id === partnerId);
                if (foundPartner) {
                    setPartner(foundPartner);
                } else {
                    notFound();
                }
            } catch (e: any) {
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        };
        loadPartner();
    }, [partnerId]);
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-full py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }
    
    if (error) {
        return <div className="text-center py-20 text-destructive">Error: {error}</div>
    }
    
    if (!partner) {
        return notFound();
    }

    return <PartnerWizard partner={partner} onBack={() => router.push('/lending?view=partners')} />;
}


export default function EditPartnerPage() {
    return (
        <div className="container mx-auto px-4 py-16">
            <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
                <EditPartnerPageContent />
            </Suspense>
        </div>
    )
}
