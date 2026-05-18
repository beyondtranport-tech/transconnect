'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] p-4">
      <Card className="w-full max-w-md text-center shadow-xl">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit mb-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Something went wrong</CardTitle>
          <CardDescription>
            The application encountered an unexpected error.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-3 rounded-md text-left mb-4">
            <p className="text-xs font-mono text-destructive break-all">
              {error.message || 'Unknown runtime error'}
            </p>
          </div>
          <Button onClick={() => reset()} className="w-full">
            <RefreshCcw className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
