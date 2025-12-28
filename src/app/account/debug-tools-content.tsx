
'use client';

import { useState } from 'react';
import { useUser, useFirestore, FirestorePermissionError } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wrench, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DebugToolsContent() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'failure'>('idle');
  const [errorOutput, setErrorOutput] = useState('');

  const handleTestRule = async () => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Not logged in' });
      return;
    }
    setIsTesting(true);
    setTestResult('idle');
    setErrorOutput('');

    try {
      // The path we want to test
      const testDocRef = doc(collection(firestore, `members/${user.uid}/shops`));
      
      // Attempt a minimal write operation
      await setDoc(testDocRef, { test: true, createdAt: serverTimestamp() });
      
      // If it succeeds
      setTestResult('success');
      toast({ title: 'Test Passed!', description: 'The security rule allows shop creation.' });
    } catch (error: any) {
      // If it fails
      setTestResult('failure');
      
      let detailedDescription = `Permission denied. The security rule is incorrect. Error: ${error.message}`;
      
      // Check if it's our custom error to get more details
      if (error instanceof FirestorePermissionError) {
          detailedDescription = JSON.stringify(error.request, null, 2);
      }
      
      setErrorOutput(detailedDescription);
      
      toast({
        variant: 'destructive',
        title: 'Test Failed!',
        description: "The request was denied by Firestore's security rules. See details below.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Wrench /> Debug Tools</CardTitle>
        <CardDescription>
          Tools to help diagnose issues with your account and permissions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Card className="bg-background">
          <CardHeader>
            <CardTitle>Shop Creation Rule Test</CardTitle>
            <CardDescription>
              This tool tests if your account has the correct Firestore permissions to create a document in your own `shops` subcollection. This is the operation that fails when you click "Create My Shop".
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">Target Path:</p>
            <code className="text-xs bg-muted p-2 rounded-md block break-all">
              /members/{user?.uid || '{your-user-id}'}/shops/&#123;new-shop-id&#125;
            </code>
            <Button onClick={handleTestRule} disabled={isTesting} className="mt-4">
              {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Test Shop Creation Rule
            </Button>
            {testResult !== 'idle' && (
              <div className="mt-4 p-4 rounded-md flex items-start gap-3" style={{backgroundColor: testResult === 'success' ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--destructive) / 0.1)'}}>
                {testResult === 'success' ? (
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                ) : (
                  <XCircle className="h-6 w-6 text-destructive flex-shrink-0" />
                )}
                <div className="w-full">
                  <p className="font-semibold" style={{color: testResult === 'success' ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'}}>
                    {testResult === 'success' ? 'Test Succeeded' : 'Test Failed'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testResult === 'success'
                      ? 'You have the correct permissions to create a shop.'
                      : 'You do not have permission. The details of the failed request are below.'}
                  </p>
                  {errorOutput && (
                    <pre className="mt-2 w-full text-xs overflow-x-auto rounded-md bg-slate-950 p-4">
                        <code className="text-white">{errorOutput}</code>
                    </pre>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
