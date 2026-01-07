
'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase/index';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Toaster } from "@/components/ui/toaster";
import Analytics from '@/components/Analytics';
import { VisitorTracker } from '@/components/VisitorTracker';
import { TooltipProvider } from '@/components/ui/tooltip';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // This memo ensures Firebase is initialized only once per client session.
  const firebaseServices = useMemo(() => {
    // Directly use the initialized services from the function.
    return initializeFirebase();
  }, []);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
      storage={firebaseServices.storage}
    >
        <TooltipProvider>
            <Analytics />
            <VisitorTracker />
            <div className="relative flex min-h-dvh flex-col bg-background">
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
            </div>
            <Toaster />
        </TooltipProvider>
    </FirebaseProvider>
  );
}
