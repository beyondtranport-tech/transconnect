
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import SetupGuide from './setup-guide';

export default function Backend() {
    // Temporarily showing the setup guide to resolve the authentication issue.
    // Once APIs are enabled, this can be reverted to show BackendPageContent.
    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <SetupGuide />
        </Suspense>
    )
}
