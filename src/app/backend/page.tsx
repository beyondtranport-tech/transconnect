
'use client';

import { Suspense, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import BackendPageContent from './backend-page-content';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';


function AdminAuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { user, isUserLoading } = useUser();

    useEffect(() => {
        if (isUserLoading) {
            return; // Wait until user state is resolved
        }

        if (!user) {
            // If not logged in, redirect to signin page, and tell it to come back here after.
            router.replace('/signin?redirect=/backend');
        } else if (user.email !== 'beyondtransport@gmail.com') {
            // If logged in but not an admin, redirect to the regular member account page.
            router.replace('/account');
        }
        // If user is an admin, do nothing and allow content to render.
    }, [user, isUserLoading, router]);

    // If still loading or the user is not an admin yet, show a loader.
    if (isUserLoading || user?.email !== 'beyondtransport@gmail.com') {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    // If the user is an admin, render the protected content.
    return <>{children}</>;
}

export default function Backend() {
    return (
        <AdminAuthGuard>
            <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
                <BackendPageContent />
            </Suspense>
        </AdminAuthGuard>
    );
}
