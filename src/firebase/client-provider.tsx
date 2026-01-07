
'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase/index';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
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
    const app = initializeFirebase();
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    const storage = getStorage(app);
    return { app, auth, firestore, storage };
  }, []);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.app}
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
