
'use client';

import { Suspense, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import BackendPageContent from './backend-page-content';
import { useUser } from '@/firebase/provider';
import { useRouter } from 'next/navigation';
import React from 'react';

function AdminAuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (isUserLoading) {
            return; // Wait until user state is resolved
        }

        if (!user) {
            // If user is not logged in, redirect to sign-in
            router.replace('/signin?redirect=/backend');
        } else if (user.email !== 'beyondtransport@gmail.com' && user.email !== 'mkoton100@gmail.com') {
            // If user is not an admin, redirect to their standard account page
            router.replace('/account');
        }
        // If the user is an admin, they are allowed to see the content.
        // The faulty redirect logic has been removed.

    }, [user, isUserLoading, router]);

    // Show a loading state while we verify the user's admin status.
    if (isUserLoading || !user || (user.email !== 'beyondtransport@gmail.com' && user.email !== 'mkoton100@gmail.com')) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[calc(100vh-8rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Verifying admin credentials...</p>
            </div>
        );
    }
    
    // Only render the children (the backend page) if the user is a loaded admin.
    return <>{children}</>;
}


export default function Backend() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <AdminAuthGuard>
                <BackendPageContent />
            </AdminAuthGuard>
        </Suspense>
    );
}
