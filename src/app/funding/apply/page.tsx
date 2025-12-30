

'use client';

import { Suspense } from 'react';
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
import { Loader2, Landmark } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser, getClientSideAuthToken } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const fundingTypes = {
    'asset-finance': 'Asset Finance',
    'working-capital': 'Working Capital',
    'partnership': 'Partnership',
    'credit-top-up': 'Credit Top-up',
    'membership_payment': 'Membership Payment',
};

const formSchema = z.object({
  fundingType: z.string().min(1, 'Please select a funding type.'),
  amountRequested: z.coerce.number().positive('Please enter a valid amount.'),
  purpose: z.string().min(10, 'Please provide a brief description of the funding purpose.'),
});

type ApplicationFormValues = z.infer<typeof formSchema>;

function ApplyForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isUserLoading } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultFundingType = searchParams.get('type') || '';
  const defaultAmount = searchParams.get('amount');

  useEffect(() => {
    if (!isUserLoading && !user) {
      const redirectUrl = `/funding/apply${defaultFundingType ? `?type=${defaultFundingType}` : ''}${defaultAmount ? `&amount=${defaultAmount}` : ''}`;
      router.replace(`/signin?redirect=${encodeURIComponent(redirectUrl)}`);
    }
  }, [user, isUserLoading, router, defaultFundingType, defaultAmount]);

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fundingType: defaultFundingType || '',
      amountRequested: defaultAmount ? Number(defaultAmount) : 0,
      purpose: '',
    },
  });
  
  useEffect(() => {
      form.reset({
          fundingType: defaultFundingType || '',
          amountRequested: defaultAmount ? Number(defaultAmount) : 0,
          purpose: '',
      })
  }, [defaultFundingType, defaultAmount, form]);


  const onSubmit = async (values: ApplicationFormValues) => {
    setIsSubmitting(true);
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      setIsSubmitting(false);
      return;
    }
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication token not found.");
        
        const enquiryData = {
            applicantId: user.uid,
            status: 'pending',
            fundingType: values.fundingType,
            amountRequested: values.amountRequested,
            purpose: values.purpose,
            createdAt: { _methodName: 'serverTimestamp' },
        };

        const response = await fetch('/api/createEnquiry', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: enquiryData }),
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Failed to submit enquiry.');
        }

        toast({
            title: 'Enquiry Submitted!',
            description: 'Thank you. A funding specialist will be in touch shortly.',
        });
        router.push('/account');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isUserLoading || !user) {
    return <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Landmark /> Funding Application</CardTitle>
        <CardDescription>Complete the form below to start the funding process. This creates an initial enquiry.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fundingType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type of Funding</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a funding type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(fundingTypes).map(([id, name]) => (
                        <SelectItem key={id} value={id}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amountRequested"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Requested (ZAR)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="500000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose of Funding</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., To purchase a new 2022 Scania R 560 truck for a new long-term contract." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Enquiry
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}


export default function ApplyPage() {
    return (
        <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16">
            <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
                <ApplyForm />
            </Suspense>
        </div>
    )
}
