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
import { useEffect, useState } from 'react';
import { Loader2, Banknote, Save } from 'lucide-react';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { setDoc, doc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDoc } from '@/firebase/firestore/use-doc';

const formSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  branchName: z.string().min(1, 'Branch name is required'),
  accountHolder: z.string().min(1, 'Account holder is required'),
  accountType: z.string().min(1, 'Account type is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  branchCode: z.string().min(1, 'Branch code is required'),
});

type BankDetailsFormValues = z.infer<typeof formSchema>;

export default function BankDetailsSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const firestore = useFirestore();

  const bankDetailsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'platform_config', 'bank_details');
  }, [firestore]);
  
  const { data: currentDetails, isLoading: isLoadingDetails } = useDoc(bankDetailsRef);

  const form = useForm<BankDetailsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bankName: '',
      branchName: '',
      accountHolder: '',
      accountType: '',
      accountNumber: '',
      branchCode: '',
    },
  });

  useEffect(() => {
    if (currentDetails) {
        form.reset(currentDetails);
    }
  }, [currentDetails, form]);

  const onSubmit = async (values: BankDetailsFormValues) => {
    setIsLoading(true);

    if (!firestore || !bankDetailsRef) {
      toast({ variant: 'destructive', title: 'Error', description: 'Firestore not available.' });
      setIsLoading(false);
      return;
    }
    
    setDoc(bankDetailsRef, values, { merge: true })
      .then(() => {
        toast({
            title: 'Bank Details Saved!',
            description: 'Your EFT details have been updated successfully.',
        });
      })
      .catch((error) => {
        const permissionError = new FirestorePermissionError({
            path: bankDetailsRef.path,
            operation: 'write',
            requestResourceData: values,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
            variant: 'destructive',
            title: 'Save Failed',
            description: 'You do not have permission to update these settings.',
        });
    }).finally(() => {
        setIsLoading(false);
    });
  };

  if (isLoadingDetails) {
    return (
      <div className="flex justify-center items-center py-10 w-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
        <CardHeader>
            <div className="flex items-center gap-4">
                <Banknote className="h-8 w-8 text-primary"/>
                <div>
                    <CardTitle>Company Bank Details</CardTitle>
                    <CardDescription>
                        Set the EFT details that members will use to top up their wallets.
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., First National Bank" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                    control={form.control}
                    name="branchName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Branch</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Sandton City" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                <FormField
                control={form.control}
                name="accountHolder"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Holder</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., TransConnect (Pty) Ltd" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="accountType"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Account Type</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Cheque" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Acc Number</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., 62800012345" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                 <FormField
                    control={form.control}
                    name="branchCode"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Branch Code</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., 250655" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                <Button type="submit" disabled={isLoading} className="mt-4">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Bank Details
                </Button>
            </form>
            </Form>
        </CardContent>
    </Card>
  );
}
