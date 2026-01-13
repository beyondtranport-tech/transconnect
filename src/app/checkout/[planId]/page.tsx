
'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useMemoFirebase, useDoc, getClientSideAuthToken } from '@/firebase';
import { doc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Banknote, ClipboardCopy, ArrowRight, CheckCircle, Wallet, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDocLoading } = useDoc<{ companyId: string }>(userDocRef);

  const companyDocRef = useMemoFirebase(() => {
    if (!firestore || !userData?.companyId) return null;
    return doc(firestore, 'companies', userData.companyId);
  }, [firestore, userData]);

  const { data: companyData, isLoading: isCompanyLoading } = useDoc(companyDocRef);

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

  const handlePurchaseWithWallet = async () => {
    if (!user || !plan || !companyData || !firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'User, plan, or database not available.' });
        return;
    }
    if (companyData.walletBalance < price) {
        toast({ variant: 'destructive', title: 'Insufficient Funds', description: 'Your wallet balance is too low to complete this purchase.' });
        return;
    }

    setIsProcessing(true);
    
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");

        const payload = {
            companyId: companyData.id,
            paymentId: `membership_${plan.id}_${Date.now()}`,
            amount: price,
            description: `Membership Purchase: ${plan.name} (${cycle})`,
            membershipDetails: {
              planId: plan.id,
              cycle: cycle,
            }
        };

        const response = await fetch('/api/payWithWallet', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || 'Payment processing failed.');
        }

        toast({
            title: 'Payment Successful!',
            description: `You are now subscribed to the ${plan.name} plan.`,
        });
        
        router.push('/account?view=dashboard');

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Purchase Failed', description: error.message });
    } finally {
        setIsProcessing(false);
    }
  };

  const isLoading = isUserLoading || isPlanLoading || isUserDocLoading || isCompanyLoading;
  const hasSufficientFunds = companyData && companyData.walletBalance >= price;

  if (isLoading || !user) {
      return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!plan) {
    return <div className="text-center"><h2 className="text-2xl font-bold">Plan Not Found</h2><Button asChild className="mt-4"><Link href="/pricing">View Plans</Link></Button></div>;
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold font-headline">Confirm and Pay</CardTitle>
        <CardDescription>You are purchasing the <span className="font-semibold text-primary">{plan.name}</span> plan.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-muted/50 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
                <p className="font-medium">{plan.name} ({cycle === 'annual' ? 'Annual' : 'Monthly'})</p>
                <p className="font-bold text-lg">{formatPrice(price)}</p>
            </div>
             <div className="flex justify-between items-center border-t pt-4">
                <p className="font-medium">Your Wallet Balance</p>
                <p className="font-bold text-lg">{formatPrice(companyData?.walletBalance || 0)}</p>
            </div>
        </div>
        
        {!hasSufficientFunds && (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Insufficient Funds</AlertTitle>
                <AlertDescription>
                    You do not have enough funds in your wallet to complete this purchase. Please top-up your wallet first.
                </AlertDescription>
            </Alert>
        )}

        <Button onClick={handlePurchaseWithWallet} disabled={isProcessing || !hasSufficientFunds} className="w-full">
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
            {hasSufficientFunds ? `Pay ${formatPrice(price)} with Wallet` : 'Insufficient Funds'}
        </Button>
      </CardContent>
       <CardFooter className="flex flex-col items-center justify-center text-xs text-muted-foreground pt-4">
            <p>Need to add funds?</p>
             <Button asChild variant="link" className="p-0 h-auto mt-1">
                <Link href="/account?view=wallet">Go to Your Wallet to Top-up</Link>
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
