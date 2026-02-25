'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ClientWizard } from '@/app/lending/client-wizard';
import { useRouter } from 'next/navigation';

function NewClientPageContent() {
    const router = useRouter();
    const handleSaveSuccess = () => {
        router.push('/lending?view=clients');
    };
    return <ClientWizard onBack={() => router.push('/lending?view=clients')} onSaveSuccess={handleSaveSuccess} />;
}

export default function NewClientPage() {
    return (
        <div className="container mx-auto px-4 py-16">
             <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin" /></div>}>
                <NewClientPageContent />
            </Suspense>
        </div>
    )
}
