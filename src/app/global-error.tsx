'use client';

import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-background text-foreground text-base">
          <h2 className="text-3xl font-bold mb-4">A critical error occurred</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            The application failed to load a core layout component. This may be due to a temporary configuration or routing issue.
          </p>
          <div className="bg-muted p-4 rounded-md mb-6 font-mono text-xs text-destructive max-w-2xl overflow-x-auto text-left">
             {error.stack || error.message}
          </div>
          <Button size="lg" onClick={() => reset()}>Restart Application</Button>
        </div>
      </body>
    </html>
  );
}
