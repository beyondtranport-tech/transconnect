
'use client';

import { Suspense, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import BackendPageContent from './backend-page-content';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import React from 'react';

function AdminAuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        // Don't redirect until loading is complete
        if (isUserLoading) {
            return; 
        }

        // If loading is done, then we can check for user and role
        if (!user) {
            router.replace('/signin?redirect=/backend');
        } else if (user.email !== 'beyondtransport@gmail.com') {
            router.replace('/account');
        }
    }, [user, isUserLoading, router]);

    // While loading, show a spinner. This is the crucial part that prevents
    // children from rendering before Firebase is ready.
    if (isUserLoading || !user || user.email !== 'beyondtransport@gmail.com') {
        return (
            <div className="flex flex-col justify-center items-center min-h-[calc(100vh-8rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Verifying admin credentials...</p>
            </div>
        );
    }
    
    // If loading is complete and user is the admin, render the requested content
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
