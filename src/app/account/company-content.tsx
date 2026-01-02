
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
import { Loader2, Building, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser, useFirestore, useMemoFirebase, getClientSideAuthToken } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Separator } from '@/components/ui/separator';

const companyFormSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  registrationNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

export default function CompanyContent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const memberDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'members', user.uid);
  }, [firestore, user]);

  const { data: memberData, isLoading: isMemberLoading } = useDoc(memberDocRef);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      companyName: '',
      registrationNumber: '',
      vatNumber: '',
      streetAddress: '',
      city: '',
      province: '',
      postalCode: '',
    },
  });

  useEffect(() => {
    if (memberData) {
      form.reset({
        companyName: memberData.companyName || '',
        registrationNumber: memberData.registrationNumber || '',
        vatNumber: memberData.vatNumber || '',
        streetAddress: memberData.streetAddress || '',
        city: memberData.city || '',
        province: memberData.province || '',
        postalCode: memberData.postalCode || '',
      });
    }
  }, [memberData, form]);

  const onSubmit = async (values: CompanyFormValues) => {
    setIsSaving(true);
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to update your profile.' });
      setIsSaving(false);
      return;
    }

    const dataToUpdate = {
        ...values,
        updatedAt: { _methodName: 'serverTimestamp' }, // Use placeholder for server-side conversion
    };

    try {
        const token = await getClientSideAuthToken();
        if (!token) {
            throw new Error('Authentication token not found.');
        }

        const response = await fetch('/api/updateUserDoc', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                path: `members/${user.uid}`,
                data: dataToUpdate
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to update company information.');
        }

        toast({
            title: 'Company Info Updated',
            description: 'Your company information has been saved.',
        });
    } catch (error: any) {
        console.error("Error updating company info:", error);
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: error.message || 'An unexpected error occurred.',
        });
    } finally {
        setIsSaving(false);
    }
  };

  const isLoading = isUserLoading || isMemberLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Building /> Company Profile</CardTitle>
        <CardDescription>View and update your company's information.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-lg font-medium">Business Details</h3>
                <Separator className="my-2" />
                <div className="space-y-4 pt-2">
                     <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                            <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="registrationNumber"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Company Registration Number</FormLabel>
                                <FormControl>
                                <Input placeholder="e.g., 2024/123456/07" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="vatNumber"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>VAT Number (Optional)</FormLabel>
                                <FormControl>
                                <Input placeholder="e.g., 4000123456" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                 </div>
              </div>

               <div>
                <h3 className="text-lg font-medium">Physical Address</h3>
                <Separator className="my-2" />
                <div className="space-y-4 pt-2">
                     <FormField
                        control={form.control}
                        name="streetAddress"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Street Address</FormLabel>
                            <FormControl>
                            <Input placeholder="123 Transport Lane" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                <Input placeholder="Johannesburg" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="province"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Province</FormLabel>
                                <FormControl>
                                <Input placeholder="Gauteng" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="postalCode"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Postal Code</FormLabel>
                                <FormControl>
                                <Input placeholder="2196" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                 </div>
              </div>

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
