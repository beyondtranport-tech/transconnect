'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useMemoFirebase, useDoc, getClientSideAuthToken } from '@/firebase';
import { doc, writeBatch, collection, serverTimestamp, increment } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Banknote, ClipboardCopy, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useConfig } from '@/hooks/use-config';

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(price);
};

function CheckoutComponent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const planId = params.planId as string;
  const cycle = searchParams.get('cycle') || 'monthly';
  
  const planRef = useMemoFirebase(() => {
      if (!firestore || !planId) return null;
      return doc(firestore, 'memberships', planId);
  }, [firestore, planId]);
  
  const { data: plan, isLoading: isPlanLoading } = useDoc(planRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push(`/signin?redirect=/checkout/${planId}?cycle=${cycle}`);
    }
  }, [user, isUserLoading, router, planId, cycle]);
  
  const price = useMemo(() => {
    if (!plan) return 0;
    if (cycle === 'annual') {
        const annualPrice = plan.price.annual || 0;
        return annualPrice > 0 ? annualPrice : plan.price.monthly * 12 * (1 - (plan.annualDiscount || 0) / 100);
    }
    return plan.price.monthly;
  }, [plan, cycle]);

  const handleConfirmPlan = async () => {
    if (!user || !plan) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in and select a valid plan.' });
        return;
    }
    setIsProcessing(true);
    
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");

        const paymentData = {
            memberId: user.uid,
            status: 'pending',
            description: `Membership Fee: ${plan.name} (${cycle})`,
            amount: price,
            createdAt: { _methodName: 'serverTimestamp' },
        };
        
        const response = await fetch('/api/createWalletPayment', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: paymentData }),
        });

        if (!response.ok) {
            throw new Error((await response.json()).error || 'Failed to create payment record.');
        }

        toast({
            title: 'Plan Confirmed!',
            description: `A payment for ${plan.name} has been added to your wallet. Please proceed to pay.`,
        });
        
        router.push('/account?view=wallet');

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Action Failed', description: error.message });
    } finally {
        setIsProcessing(false);
    }
  };

  const isLoading = isUserLoading || isPlanLoading;

  if (isLoading || !user) {
      return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!plan) {
    return <div className="text-center"><h2 className="text-2xl font-bold">Plan Not Found</h2><Button asChild className="mt-4"><Link href="/pricing">View Plans</Link></Button></div>;
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold font-headline">Confirm Your Plan</CardTitle>
        <CardDescription>You are selecting the <span className="font-semibold text-primary">{plan.name}</span> plan.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex justify-between items-center">
                <p className="font-medium">{plan.name} ({cycle === 'annual' ? 'Annual' : 'Monthly'})</p>
                <p className="font-bold text-lg">{formatPrice(price)}</p>
            </div>
             <p className="text-xs text-muted-foreground mt-2">
                By confirming, a receivable for this amount will be added to your wallet. You can then pay it using your wallet balance.
            </p>
        </div>
        <Button onClick={handleConfirmPlan} disabled={isProcessing} className="w-full">
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Confirm and Proceed to Wallet
        </Button>
      </CardContent>
       <CardFooter className="flex flex-col items-center justify-center text-xs text-muted-foreground pt-4">
            <p>Ensure you have sufficient funds in your wallet before paying.</p>
             <Button asChild variant="link" className="p-0 h-auto mt-2">
                <Link href="/account?view=wallet">Go to Wallet to Top-up</Link>
             </Button>
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
