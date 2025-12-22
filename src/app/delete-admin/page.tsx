
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DeleteAdminPage() {
  const { toast } = useToast();
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
        throw new Error(data.error || 'Something went wrong');
      }
      
      setResult({ message: data.message });
      toast({ title: 'Success', description: data.message });

    } catch (error: any) {
      setResult({ message: error.message, error: true });
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
            <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          <CardTitle>Delete Admin User Account</CardTitle>
          <CardDescription>
            Use this one-time tool to delete the user 'beyondtransport@gmail.com' if it is in a broken state.
            This will permanently remove the user from Firebase Authentication.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleDelete} disabled={isLoading} variant="destructive" className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
            Delete Admin User
          </Button>

          {result && (
            <div className={`mt-4 text-sm p-3 rounded-md ${result.error ? 'bg-destructive/10 text-destructive' : 'bg-green-600/10 text-green-700'}`}>
              <p>{result.message}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
