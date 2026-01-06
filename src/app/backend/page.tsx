
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import BackendPageContent from './backend-page-content';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/firebase';


function AdminRedirect() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();

    useEffect(() => {
        if (!isUserLoading) {
            if (user?.email === 'beyondtransport@gmail.com') {
                // Already an admin, do nothing. Let the page content render.
            } else if (user) {
                // Logged in, but not an admin. Redirect to member account.
                router.replace('/account');
            } else {
                // Not logged in. Redirect to signin page with a redirect back to here.
                router.replace('/signin?redirect=/backend');
            }
        }
    }, [user, isUserLoading, router]);

    return (
         <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
}

export default function Backend() {
    const { user, isUserLoading } = useUser();
    
    // While loading, show the redirect component which handles logic.
    if (isUserLoading) {
        return <AdminRedirect />;
    }
    
    // If the user is definitively not an admin, the redirect will have already fired.
    // If they are an admin, render the content.
    if (user?.email === 'beyondtransport@gmail.com') {
        return (
            <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
                <BackendPageContent />
            </Suspense>
        )
    }

    // Fallback for non-admins, the redirect should handle this anyway.
    return <AdminRedirect />;
}
