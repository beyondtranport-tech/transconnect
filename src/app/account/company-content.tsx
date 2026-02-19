
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
import { Loader2, Building, Save, Banknote, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser, useFirestore, useDoc, useMemoFirebase, errorEmitter } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';
import { useRouter, useSearchParams } from 'next/navigation';

const companyFormSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  registrationNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  bankName: z.string().optional(),
  branchCode: z.string().optional(),
  accountNumber: z.string().optional(),
  accountHolderName: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

export default function CompanyContent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromWallet = searchParams.get('from') === 'wallet';

  // Fetch user document directly to get the companyId, ensuring it's up-to-date.
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  // Derive the companyDocRef from the locally-fetched userData.
  const companyDocRef = useMemoFirebase(() => {
    if (!firestore || !userData?.companyId) return null;
    return doc(firestore, 'companies', userData.companyId);
  }, [firestore, userData?.companyId]);

  const { data: companyData, isLoading: isCompanyLoading, forceRefresh } = useDoc(companyDocRef);

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
      bankName: '',
      branchCode: '',
      accountNumber: '',
      accountHolderName: '',
    },
  });

  useEffect(() => {
    if (companyData) {
      let companyName = companyData.companyName;
      // If company name is empty or a placeholder, but we have user's name, create a better default.
      if ((!companyName || companyName === 'My Company') && userData?.firstName) {
        const ownerName = `${userData.firstName} ${userData.lastName || ''}`.trim();
        companyName = ownerName ? `${ownerName}'s Company` : 'My Company';
      }
      form.reset({
        companyName: companyName || '',
        registrationNumber: companyData.registrationNumber || '',
        vatNumber: companyData.vatNumber || '',
        streetAddress: companyData.streetAddress || '',
        city: companyData.city || '',
        province: companyData.province || '',
        postalCode: companyData.postalCode || '',
        bankName: companyData.bankName || '',
        branchCode: companyData.branchCode || '',
        accountNumber: companyData.accountNumber || '',
        accountHolderName: companyData.accountHolderName || '',
      });
    }
  }, [companyData, userData, form]);

  const onSubmit = async (values: CompanyFormValues) => {
    setIsSaving(true);
    if (!companyDocRef) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not find company information. Please log in again.' });
      setIsSaving(false);
      return;
    }

    const dataToUpdate = {
        ...values,
        updatedAt: serverTimestamp(),
    };

    updateDoc(companyDocRef, dataToUpdate)
        .then(() => {
            toast({
                title: 'Company Info Updated',
                description: 'Your company information has been saved.',
            });
            forceRefresh();
        })
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: companyDocRef.path,
                operation: 'update',
                requestResourceData: dataToUpdate,
            });
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
            setIsSaving(false);
        });
  };

  const isLoading = isUserLoading || isCompanyLoading || isUserDataLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Building /> Company Profile</CardTitle>
        <CardDescription>View and update your company's information and payout bank details.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
              <div>
                <h3 className="text-lg font-medium">Business Details</h3>
                <Separator className="my-2" />
                <div className="space-y-4 pt-2">
                     <FormField control={form.control} name="companyName" render={({ field }) => (
                        <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="registrationNumber" render={({ field }) => (
                            <FormItem><FormLabel>Registration Number</FormLabel><FormControl><Input placeholder="e.g., 2024/123456/07" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="vatNumber" render={({ field }) => (
                            <FormItem><FormLabel>VAT Number (Optional)</FormLabel><FormControl><Input placeholder="e.g., 4000123456" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                 </div>
              </div>

               <div>
                <h3 className="text-lg font-medium">Physical Address</h3>
                <Separator className="my-2" />
                <div className="space-y-4 pt-2">
                     <FormField control={form.control} name="streetAddress" render={({ field }) => (
                        <FormItem><FormLabel>Street Address</FormLabel><FormControl><Input placeholder="123 Transport Lane" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="city" render={({ field }) => (
                            <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="Johannesburg" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="province" render={({ field }) => (
                            <FormItem><FormLabel>Province</FormLabel><FormControl><Input placeholder="Gauteng" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="postalCode" render={({ field }) => (
                            <FormItem><FormLabel>Postal Code</FormLabel><FormControl><Input placeholder="2196" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                 </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium flex items-center gap-2"><Banknote/> Bank Details for Payouts</h3>
                 <p className="text-sm text-muted-foreground">This is the account where your earnings from sales and commissions will be paid.</p>
                <Separator className="my-2" />
                <div className="space-y-4 pt-2">
                     <FormField control={form.control} name="accountHolderName" render={({ field }) => (
                        <FormItem><FormLabel>Account Holder Name</FormLabel><FormControl><Input placeholder="Your Company (Pty) Ltd" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="bankName" render={({ field }) => (
                            <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input placeholder="e.g., FNB" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="branchCode" render={({ field }) => (
                            <FormItem><FormLabel>Branch Code</FormLabel><FormControl><Input placeholder="e.g., 250655" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="accountNumber" render={({ field }) => (
                            <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input placeholder="e.g., 62000000000" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                 </div>
              </div>

              <div className="flex items-center gap-4">
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
                {fromWallet && (
                    <Button variant="outline" type="button" onClick={() => router.push('/account?view=wallet')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Return to Wallet
                    </Button>
                )}
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
