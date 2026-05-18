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
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-background">
          <h2 className="text-2xl font-bold mb-4">A critical error occurred</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            The application failed to load a core component. This may be due to a temporary configuration issue.
          </p>
          <div className="bg-muted p-4 rounded-md mb-6 font-mono text-xs text-destructive">
             {error.message}
          </div>
          <Button onClick={() => reset()}>Try Again</Button>
        </div>
      </body>
    </html>
  );
}
