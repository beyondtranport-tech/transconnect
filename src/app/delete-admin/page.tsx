'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';

export default function DeleteAdminPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ message: string; error?: boolean } | null>(null);

  const handleDelete = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await fetch('/api/delete-admin', {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'An unknown error occurred.');
      }
      setResult({ message: data.message });
    } catch (error: any) {
      setResult({ message: error.message, error: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Delete Admin User Account</CardTitle>
          <CardDescription>
            Use this one-time tool to delete the user 'beyondtransport@gmail.com' if it is in a broken state.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-4">This will permanently remove the user from Firebase Authentication.</p>
          <Button onClick={handleDelete} disabled={isLoading} variant="destructive">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <AlertTriangle className="mr-2 h-4 w-4" />
            )}
            Delete Admin User
          </Button>

          {result && (
            <div className={`mt-6 text-sm ${result.error ? 'text-destructive' : 'text-primary'}`}>
              <p>{result.message}</p>
            </div>
          )}
           <div className="mt-6 text-xs text-muted-foreground">
             <p>After successful deletion, notify the AI to proceed with the next step: re-creating the user correctly via the 'Join Now' page.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
