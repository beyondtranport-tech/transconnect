
'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Toaster } from "@/components/ui/toaster"
import Analytics from '@/components/Analytics';
import { VisitorTracker } from '@/components/VisitorTracker';

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Analytics />
            <VisitorTracker />
            <div className="relative flex min-h-dvh flex-col bg-background">
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
            </div>
            <Toaster />
        </>
    );
}
