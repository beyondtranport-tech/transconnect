
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { getClientSideAuthToken } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { EntityWizard } from '@/app/lending/entity-wizard';

async function performAdminAction(token: string, action: string, payload: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || `API Error: ${action}`);
    return result.data;
}


function EditClientPageContent() {
    const params = useParams();
    const router = useRouter();
    const clientId = params.clientId as string;
    const [client, setClient] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadClient = async () => {
            if (!clientId) return;
            setIsLoading(true);
            try {
                const token = await getClientSideAuthToken();
                if (!token) throw new Error("Auth failed.");
                
                const data = await performAdminAction(token, 'getLendingClientById', { clientId });
                if (data) {
                    setClient(data);
                } else {
                    notFound();
                }
            } catch (e: any) {
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        };
        loadClient();
    }, [clientId]);
    
    const handleSaveSuccess = () => {
        router.push('/lending?view=clients');
    };
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-full py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }
    
    if (error) {
        return <div className="text-center py-20 text-destructive">Error: {error}</div>
    }
    
    if (!client) {
        return notFound();
    }

    return <EntityWizard entity={client} entityType="client" onBack={() => router.push('/lending?view=clients')} onSaveSuccess={handleSaveSuccess} />;
}


export default function EditClientPage() {
    return (
        <div className="container mx-auto px-4 py-16">
            <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
                <EditClientPageContent />
            </Suspense>
        </div>
    )
}
