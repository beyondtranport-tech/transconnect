
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// THIS IS A TEMPORARY PAGE AND SHOULD BE DELETED AFTER USE.

export default function SetupAdminPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const adminEmail = 'beyondtransport@gmail.com';
  const adminPassword = 'TransConnectAdmin2024';

  const handleSetup = async () => {
    if (!auth || !firestore) {
      toast({ variant: 'destructive', title: 'Firebase not initialized.' });
      return;
    }
    setIsLoading(true);

    try {
      // 1. Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      const user = userCredential.user;

      await updateProfile(user, { displayName: 'Super Admin' });

      // 2. Create the user document in Firestore with the admin flag
      const memberData = {
        id: user.uid,
        firstName: 'Super',
        lastName: 'Admin',
        email: user.email,
        phone: 'N/A',
        companyName: 'TransConnect',
        membershipId: 'premium',
        rewardPoints: 0,
        admin: true, // Set the admin flag
      };

      const memberDocRef = doc(firestore, 'members', user.uid);
      await setDoc(memberDocRef, memberData);

      toast({
        title: 'Admin Account Created Successfully!',
        description: `Email: ${adminEmail} | Password: ${adminPassword}`,
      });
      setIsDone(true);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast({
          variant: 'default',
          title: 'Admin Already Exists',
          description: 'The admin account has likely already been created. You can now delete this setup file.',
        });
        setIsDone(true);
      } else {
        toast({
          variant: 'destructive',
          title: 'Setup Failed',
          description: error.message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>One-Time Admin Setup</CardTitle>
          <CardDescription>
            Click the button to create the administrator account. This page should be deleted immediately after use.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isDone ? (
            <div className="text-center text-green-600 font-semibold">
              <p>Setup complete. You can now log in with the admin credentials.</p>
              <p className="mt-2 text-sm text-muted-foreground">Please confirm with the AI to re-enable security.</p>
            </div>
          ) : (
            <Button onClick={handleSetup} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Admin User
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
