'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Loader2, User, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser, useFirestore, useDoc, errorEmitter, useMemoFirebase, getClientSideAuthToken } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';


const profileFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(1, 'Phone number is required'),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfileContent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDocLoading, forceRefresh } = useDoc(userDocRef);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (userData) {
      form.reset({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phone: userData.phone || '',
      });
    } else if (user) {
       // Pre-fill from auth if DB is empty
       const nameParts = user.displayName?.split(' ') || ['',''];
       form.reset({
            firstName: nameParts[0],
            lastName: nameParts.slice(1).join(' '),
            phone: user.phoneNumber || '',
       });
    }
  }, [userData, user, form]);

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSaving(true);
    if (!userDocRef) {
      toast({ variant: 'destructive', title: 'Error', description: 'Not logged in.' });
      setIsSaving(false);
      return;
    }

    const dataToUpdate = {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        updatedAt: { _methodName: 'serverTimestamp' },
    };
    
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");

        const response = await fetch('/api/updateUserDoc', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                path: userDocRef.path,
                data: dataToUpdate
            }),
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Failed to update profile.');
        }

        toast({
          title: 'Profile Updated',
          description: 'Your personal information has been saved.',
        });
        forceRefresh();
        router.push('/account?view=dashboard');
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: error.message,
        });
    } finally {
        setIsSaving(false);
    }
  };

  const isLoading = isUserLoading || isUserDocLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><User /> My Profile</CardTitle>
        <CardDescription>View and update your personal information.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
                <FormItem>
                    <FormLabel>Email (Cannot be changed)</FormLabel>
                    <FormControl>
                        <Input disabled value={user?.email || 'Loading...'} />
                    </FormControl>
                </FormItem>
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}