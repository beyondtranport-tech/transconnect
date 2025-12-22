
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function SetupAdminPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSetup = async () => {
    setIsLoading(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/setup-admin', {
        method: 'POST',
      });
      const result = await response.json();
      
      if (response.ok) {
        setMessage(result.message);
      } else {
        setError(result.error || 'An unknown error occurred.');
      }

    } catch (e: any) {
      setError('Failed to fetch the setup endpoint: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>One-Time Admin Setup</CardTitle>
          <CardDescription>
            Click the button to create the administrator account. This page should be deleted immediately after use.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center">
          <Button onClick={handleSetup} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Admin User
          </Button>
          {message && (
            <div className="mt-4 text-center text-green-600">
              <p>{message}</p>
              <p className="font-bold">Please confirm with the AI to re-enable security.</p>
            </div>
          )}
          {error && (
            <div className="mt-4 text-center text-destructive">
              <p>Error: {error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
