'use client';

import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';
import { CartProvider } from '@/context/CartContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import Analytics from '@/components/Analytics';
import { Suspense } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <CartProvider>
        <TooltipProvider>
          <Suspense fallback={null}>
            <Analytics />
            {children}
          </Suspense>
          <Toaster />
        </TooltipProvider>
      </CartProvider>
    </FirebaseClientProvider>
  );
}
