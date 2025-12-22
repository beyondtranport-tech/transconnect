
'use client';

import { Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, CreditCard, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const tiers = [
  { id: 'basic', name: 'Basic', price: { monthly: 375, annual: 375 * 12 * 0.85 } },
  { id: 'standard', name: 'Standard', price: { monthly: 425, annual: 425 * 12 * 0.85 } },
  { id: 'premium', name: 'Premium', price: { monthly: 475, annual: 475 * 12 * 0.85 } },
];

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(price);
};

const paymentFormSchema = z.object({
  cardName: z.string().min(1, 'Name on card is required'),
  cardNumber: z.string().refine((val) => /^\d{16}$/.test(val.replace(/\s/g, '')), 'Invalid card number'),
  expiryDate: z.string().refine((val) => /^(0[1-9]|1[0-2])\s*\/\s*([2-9][0-9])$/.test(val), 'Invalid expiry date (MM/YY)'),
  cvc: z.string().refine((val) => /^\d{3}$/.test(val), 'Invalid CVC'),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

function CheckoutComponent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  
  const planId = params.planId as string;
  const cycle = searchParams.get('cycle') || 'monthly';
  
  const plan = tiers.find(t => t.id === planId);
  
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: { cardName: '', cardNumber: '', expiryDate: '', cvc: '' },
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push(`/signin?redirect=/checkout/${planId}?cycle=${cycle}`);
    }
  }, [user, isUserLoading, router, planId, cycle]);


  const handlePayment = async (values: PaymentFormValues) => {
    setIsLoading(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (!user || !firestore || !plan) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not process payment. User or plan not found.',
        });
        setIsLoading(false);
        return;
    }

    try {
        const memberRef = doc(firestore, 'members', user.uid);
        const updateData = { membershipId: plan.id };
        setDoc(memberRef, updateData, { merge: true })
         .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: memberRef.path,
                operation: 'update',
                requestResourceData: updateData,
            });
            errorEmitter.emit('permission-error', permissionError);
             toast({
                variant: 'destructive',
                title: 'Upgrade Failed',
                description: 'You do not have permission to update your membership.',
            });
        });

        toast({
            title: 'Payment Successful!',
            description: `Your membership has been upgraded to ${plan.name}.`,
        });

        router.push('/account');

    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'An unexpected error occurred',
            description: 'Could not update your membership. Please contact support.',
        });
        setIsLoading(false);
    }
  };
  
  if (isUserLoading || !user) {
      return (
          <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      );
  }

  if (!plan) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">Plan Not Found</h2>
        <p className="text-muted-foreground">The selected plan could not be found.</p>
        <Button asChild className="mt-4"><Link href="/pricing">View Plans</Link></Button>
      </div>
    );
  }

  const price = plan.price[cycle as 'monthly' | 'annual'];

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold font-headline">Complete Your Purchase</CardTitle>
        <CardDescription>You are purchasing the <span className="font-semibold text-primary">{plan.name}</span> plan.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex justify-between items-center">
                <p className="font-medium">{plan.name} Plan ({cycle === 'annual' ? 'Annual' : 'Monthly'})</p>
                <p className="font-bold text-lg">{formatPrice(price)}</p>
            </div>
            <p className="text-sm text-muted-foreground mt-1">+ VAT</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handlePayment)} className="space-y-4">
            <FormField
                control={form.control}
                name="cardName"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Name on Card</FormLabel>
                    <FormControl><Input placeholder="John M. Doe" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="cardNumber"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Card Number</FormLabel>
                    <div className="relative">
                     <FormControl><Input placeholder="0000 0000 0000 0000" {...field} /></FormControl>
                     <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    </div>
                    <FormMessage />
                </FormItem>
                )}
            />
            <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Expiry (MM/YY)</FormLabel>
                        <FormControl><Input placeholder="MM/YY" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="cvc"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>CVC</FormLabel>
                        <FormControl><Input placeholder="123" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
             <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                Confirm Payment
            </Button>
          </form>
        </Form>
      </CardContent>
       <CardFooter className="flex flex-col items-center justify-center text-xs text-muted-foreground pt-4">
            <p>This is a simulated payment form for demonstration purposes.</p>
            <p>No real transaction will be made.</p>
       </CardFooter>
    </Card>
  );
}

export default function CheckoutPage() {
    return (
        <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16">
            <Suspense fallback={<Loader2 className="h-12 w-12 animate-spin text-primary" />}>
                <CheckoutComponent />
            </Suspense>
        </div>
    );
}
