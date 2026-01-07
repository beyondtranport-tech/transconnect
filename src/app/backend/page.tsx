
'use client';

import { Suspense, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import BackendPageContent from './backend-page-content';
import { useUser } from '@/firebase/hooks';
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
            router.replace('/signin?redirect=/backend');
        } else if (user.email !== 'beyondtransport@gmail.com') {
            router.replace('/account');
        }
    }, [user, isUserLoading, router]);

    // This is the key: show a loading state until Firebase has confirmed the user's status.
    if (isUserLoading || !user || user.email !== 'beyondtransport@gmail.com') {
        return (
            <div className="flex flex-col justify-center items-center min-h-[calc(100vh-8rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Verifying admin credentials...</p>
            </div>
        );
    }
    
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
