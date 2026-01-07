import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import React from 'react';

export default function BackendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
