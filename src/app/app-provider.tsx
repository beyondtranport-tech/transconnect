'use client';

import { FirebaseClientProvider } from '@/firebase/client-provider';
import React, { type ReactNode } from 'react';

// This is a new client-side-only component that wraps the app with all necessary providers.
export function AppProvider({ children }: { children: ReactNode }) {
  return (
      <FirebaseClientProvider>
          {children}
      </FirebaseClientProvider>
  );
}
