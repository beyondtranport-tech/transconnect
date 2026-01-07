'use client';

import { FirebaseClientProvider } from '@/firebase/client-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import React, { type ReactNode } from 'react';

// This is a new client-side-only component that wraps the app with all necessary providers.
export function AppProvider({ children }: { children: ReactNode }) {
  return (
      <FirebaseClientProvider>
          <TooltipProvider>
              {children}
          </TooltipProvider>
      </FirebaseClientProvider>
  );
}
