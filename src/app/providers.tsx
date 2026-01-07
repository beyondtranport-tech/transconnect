
'use client';

import { FirebaseClientProvider } from '@/firebase';
import { TooltipProvider } from '@/components/ui/tooltip';

export function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <FirebaseClientProvider>
          <TooltipProvider>{children}</TooltipProvider>
      </FirebaseClientProvider>
  );
}
