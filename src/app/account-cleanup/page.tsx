
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword, deleteUser } from 'firebase/auth';

export default function AccountCleanupPage() {
  const { toast } = useToast();
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('beyondtransport@gmail.com');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<{ message: string; error?: boolean } | null>(null);

  const handleCleanup = async () => {
    if (!auth) {
      toast({ variant: 'destructive', title: 'Error', description: 'Firebase Auth not initialized.' });
      return;
    }
    if (!email || !password) {
      toast({ variant: 'destructive', title: 'Error', description: 'Email and password are required.' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      // Step 1: Sign in to the broken user account.
      // This is necessary because deleting a user is a sensitive operation
      // and requires the user to be recently authenticated.
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Step 2: If sign-in is successful, immediately delete the user.
      await deleteUser(user);

      const successMessage = `Successfully signed in and deleted user: ${email}. You can now re-create it on the 'Join Now' page.`;
      setResult({ message: successMessage });
      toast({ title: 'Cleanup Successful', description: successMessage });

    } catch (error: any) {
      let errorMessage = 'An unknown error occurred.';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid password. If you do not know the password for the broken account, you may not be able to clean it up with this tool.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = `User ${email} does not exist. It may have already been deleted. You can try creating it on the 'Join Now' page.`;
      } else {
        errorMessage = error.message;
      }
      
      setResult({ message: errorMessage, error: true });
       toast({ variant: 'destructive', title: 'Cleanup Failed', description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
             <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit mb-4">
                <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
          <CardTitle>Account Cleanup Tool</CardTitle>
          <CardDescription>
            Use this to forcefully delete a broken user account from the client-side.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">Email to Delete</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email of the broken account" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password for the account" />
             <p className="text-xs text-muted-foreground mt-1">
               This tool requires the password to re-authenticate before deletion. If the password is unknown, this tool cannot proceed.
             </p>
          </div>
          <Button onClick={handleCleanup} disabled={isLoading} variant="destructive" className="w-full">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <AlertTriangle className="mr-2 h-4 w-4" />
            )}
            Force Re-authentication & Delete
          </Button>

          {result && (
            <div className={`mt-4 text-sm p-3 rounded-md ${result.error ? 'bg-destructive/10 text-destructive' : 'bg-green-600/10 text-green-700'}`}>
              <p>{result.message}</p>
            </div>
          )}
           <div className="mt-6 text-xs text-muted-foreground text-center">
             <p>After successful deletion, notify the AI to re-enable security and then proceed to the 'Join Now' page to create the account again.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
