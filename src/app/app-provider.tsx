'use client';

import { FirebaseClientProvider } from '@/firebase/client-provider';

export function AppProvider({ children }: { children: React.ReactNode }) {
  return <FirebaseClientProvider>{children}</FirebaseClientProvider>;
}
