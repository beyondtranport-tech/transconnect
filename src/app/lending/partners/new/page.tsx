
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { PartnerWizard } from '@/app/lending/partner-wizard';
import { useRouter } from 'next/navigation';

function NewPartnerPageContent() {
    const router = useRouter();
    return <PartnerWizard onBack={() => router.push('/lending?view=partners')} />;
}

export default function NewPartnerPage() {
    return (
        <div className="container mx-auto px-4 py-16">
             <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin" /></div>}>
                <NewPartnerPageContent />
            </Suspense>
        </div>
    )
}
