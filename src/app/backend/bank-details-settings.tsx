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
import { Loader2, Banknote, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { bankDetails } from '@/lib/bank-details.json';

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
  const safeBankDetails = bankDetails || {};

  const form = useForm<BankDetailsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bankName: safeBankDetails.bankName || '',
      branchName: safeBankDetails.branchName || '',
      accountHolder: safeBankDetails.accountHolder || '',
      accountType: safeBankDetails.accountType || '',
      accountNumber: safeBankDetails.accountNumber || '',
      branchCode: safeBankDetails.branchCode || '',
    },
  });

  const onSubmit = async (values: BankDetailsFormValues) => {
    setIsLoading(true);
    
    // This now serves as an instruction for the developer.
    // The data is logged to the console to be copied into the JSON file.
    console.log("New bank details to be saved:", JSON.stringify(values, null, 2));

    toast({
        title: 'Form Submitted (Developer Instruction)',
        description: 'New bank details have been logged to the console. The developer will now update the central configuration file.',
    });
    
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-2xl">
        <CardHeader>
            <div className="flex items-center gap-4">
                <Banknote className="h-8 w-8 text-primary"/>
                <div>
                    <CardTitle>Company Bank Details</CardTitle>
                    <CardDescription>
                        Set the EFT details that members will use to top up their wallets. Submit this form to provide the new details to the developer.
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
