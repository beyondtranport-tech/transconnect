'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { AgreementWizard } from '@/app/lending/agreement-wizard';
import { notFound } from 'next/navigation';

function AgreementDetailPage() {
    const params = useParams();
    const { clientId, agreementId } = params as { clientId: string, agreementId: string };
    const firestore = useFirestore();

    const agreementRef = useMemoFirebase(() => {
        if (!firestore || !clientId || !agreementId) return null;
        return doc(firestore, `lendingClients/${clientId}/agreements/${agreementId}`);
    }, [firestore, clientId, agreementId]);
    const { data: agreement, isLoading, error } = useDoc(agreementRef);
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-full py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }
    
    if (error) {
        return <div className="text-center py-20 text-destructive">Error: {error.message}</div>
    }
    
    if (!agreement) {
        return notFound();
    }

    return <AgreementWizard agreement={agreement} />;
}

export default function AgreementDetailPageWrapper() {
    return (
        <div className="container mx-auto px-4 py-16">
            <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
                <AgreementDetailPage />
            </Suspense>
        </div>
    )
}
