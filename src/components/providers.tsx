
'use client';

import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';
import { CartProvider } from '@/context/CartContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import Analytics from '@/components/Analytics';
import { VisitorTracker } from '@/components/VisitorTracker';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <CartProvider>
        <TooltipProvider>
          <Analytics />
          <VisitorTracker />
          {children}
          <Toaster />
        </TooltipProvider>
      </CartProvider>
    </FirebaseClientProvider>
  );
}
