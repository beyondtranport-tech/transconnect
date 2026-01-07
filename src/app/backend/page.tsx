
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import BackendPageContent from './backend-page-content';

// The authentication and loading logic is now handled inside BackendPageContent
export default function Backend() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <BackendPageContent />
        </Suspense>
    );
}
