
'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from '@/firebase';
import Analytics from '@/components/Analytics';
import { VisitorTracker } from '@/components/VisitorTracker';

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <FirebaseClientProvider>
            <Analytics />
            <VisitorTracker />
            <div className="relative flex min-h-dvh flex-col bg-background">
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
            </div>
            <Toaster />
        </FirebaseClientProvider>
    );
}
