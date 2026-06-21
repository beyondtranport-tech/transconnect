
'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, getClientSideAuthToken } from '@/firebase';
import { doc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, ArrowLeft, Wallet, AlertCircle, CheckCircle, ShieldCheck, Zap, Heart, Gift } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useMemoFirebase } from '@/hooks/use-memo-firebase';
import { formatCurrency } from '@/lib/utils';

const iconMap: Record<string, any> = {
    loyalty: Heart,
    rewards: Gift,
    actions: Zap,
    intelligence: ShieldCheck,
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
  const isConnectPlan = ['loyalty', 'rewards', 'actions'].includes(planId);
  
  // 1. Resolve Plan References
  const membershipRef = useMemoFirebase(() => {
      if (!firestore || !planId || isConnectPlan) return null;
      return doc(firestore, 'memberships', planId);
  }, [firestore, planId, isConnectPlan]);

  const connectConfigRef = useMemoFirebase(() => {
      if (!firestore || !isConnectPlan) return null;
      return doc(firestore, 'configuration', 'connectPlans');
  }, [firestore, isConnectPlan]);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  // 2. Fetch Data
  const { data: userData } = useDoc<{ companyId: string }>(userDocRef);
  const companyDocRef = useMemoFirebase(() => {
    if (!firestore || !userData?.companyId) return null;
    return doc(firestore, 'companies', userData.companyId);
  }, [firestore, userData]);

  const { data: companyData, isLoading: isCompanyLoading } = useDoc(companyDocRef);
  const { data: membershipPlan, isLoading: isMembershipLoading } = useDoc(membershipRef);
  const { data: connectConfig, isLoading: isConnectLoading } = useDoc<any>(connectConfigRef);
  
  // 3. Auth Guard
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push(`/signin?redirect=/checkout/${planId}?cycle=${cycle}`);
    }
  }, [user, isUserLoading, router, planId, cycle]);
  
  // 4. Resolve Display Data
  const planDisplay = useMemo(() => {
    if (isConnectPlan && connectConfig) {
        const priceKey = `${planId}PlanPrice`;
        return {
            name: planId.charAt(0).toUpperCase() + planId.slice(1) + ' Plan',
            price: Number(connectConfig[priceKey]) || 50,
            description: `Optional ecosystem add-on for the ${planId} division.`,
            type: 'connect'
        };
    }
    if (membershipPlan) {
        const monthlyPrice = (typeof membershipPlan.price === 'object' && membershipPlan.price !== null)
            ? membershipPlan.price.monthly || 0
            : membershipPlan.price || 0;
            
        const specialOfferDiscount = membershipPlan.specialOfferDiscount || 0;
        const finalMonthlyPrice = monthlyPrice * (1 - (specialOfferDiscount / 100));

        if (cycle === 'annual') {
            const annualDiscount = membershipPlan.annualDiscount || 0;
            const baseAnnualPrice = monthlyPrice * 12 * (1 - (annualDiscount / 100));
            return {
                name: membershipPlan.name,
                price: baseAnnualPrice * (1 - (specialOfferDiscount / 100)),
                description: membershipPlan.description,
                type: 'membership'
            };
        }
        return {
            name: membershipPlan.name,
            price: finalMonthlyPrice,
            description: membershipPlan.description,
            type: 'membership'
        };
    }
    return null;
  }, [planId, isConnectPlan, connectConfig, membershipPlan, cycle]);

  const handlePurchase = async () => {
    if (!user || !planDisplay || !companyData || !firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'System not ready.' });
        return;
    }
    
    if (companyData.availableBalance < planDisplay.price) {
        toast({ variant: 'destructive', title: 'Insufficient Funds', description: 'Please top-up your wallet to complete this purchase.' });
        return;
    }

    setIsProcessing(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");

        const payload = {
            companyId: companyData.id,
            amount: planDisplay.price,
            description: `Plan Activation: ${planDisplay.name} (${cycle})`,
            planType: planDisplay.type, // 'membership' or 'connect'
            planId: planId,
            cycle: cycle,
        };

        const response = await fetch('/api/payWithWallet', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Payment failed.');

        toast({
            title: 'Activation Successful!',
            description: `The ${planDisplay.name} is now active on your account.`,
        });
        
        router.push('/account?view=dashboard');

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Purchase Failed', description: error.message });
    } finally {
        setIsProcessing(false);
    }
  };

  const isLoading = isUserLoading || isMembershipLoading || isConnectLoading || isCompanyLoading;
  const PlanIcon = iconMap[planId] || ShieldCheck;

  if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Preparing Checkout...</p>
        </div>
      );
  }

  if (!planDisplay) {
    return (
        <div className="container mx-auto max-w-md py-20 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Plan Configuration Error</h2>
            <p className="text-muted-foreground mt-2">We couldn't retrieve the details for this plan. It might be undergoing maintenance.</p>
            <Button asChild className="mt-6" variant="outline"><Link href="/pricing">Return to Pricing</Link></Button>
        </div>
    );
  }

  const hasSufficientFunds = companyData && companyData.availableBalance >= planDisplay.price;

  return (
    <div className="container mx-auto px-4 py-16 flex justify-center text-left">
        <Card className="w-full max-w-xl shadow-2xl border-none overflow-hidden">
            <CardHeader className="bg-slate-900 text-white p-8">
                <div className="flex items-center gap-4">
                    <div className="bg-primary/20 p-3 rounded-xl"><PlanIcon className="h-8 w-8 text-primary" /></div>
                    <div className="text-left">
                        <CardTitle className="text-2xl font-black font-headline">Finalize Activation</CardTitle>
                        <CardDescription className="text-slate-400">Review your plan details and confirm payment.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="p-8 space-y-8 text-left">
                <div className="space-y-4">
                    <div className="flex justify-between items-baseline text-left">
                        <h3 className="text-xl font-bold">{planDisplay.name}</h3>
                        <p className="text-2xl font-black text-primary">{formatCurrency(planDisplay.price)}</p>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{planDisplay.description}</p>
                    <Badge variant="secondary" className="capitalize">{cycle} billing cycle</Badge>
                </div>

                <Separator />

                <div className="space-y-4 text-left">
                    <div className="flex justify-between items-center text-left">
                        <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Available Wallet Balance</span>
                        <span className="font-mono font-bold">{formatCurrency(companyData?.availableBalance)}</span>
                    </div>
                    
                    {!hasSufficientFunds && (
                        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-left">
                            <AlertCircle className="h-5 w-5" />
                            <AlertTitle className="font-bold text-left">Insufficient Funds</AlertTitle>
                            <AlertDescription className="text-xs mt-1 text-left">
                                You need an additional **{formatCurrency(planDisplay.price - (companyData?.availableBalance || 0))}** to complete this activation.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-dashed text-left">
                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary"/>
                        Ecosystem Agreement
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                        By clicking "Confirm & Activate", you authorize Logistics Flow to debit {formatCurrency(planDisplay.price)} from your wallet. Subscriptions will renew automatically on the next billing date unless cancelled.
                    </p>
                </div>
            </CardContent>

            <CardFooter className="p-8 bg-muted/20 border-t flex flex-col gap-4">
                <Button 
                    onClick={handlePurchase} 
                    disabled={isProcessing || !hasSufficientFunds} 
                    className="w-full h-14 text-lg font-black uppercase tracking-tight shadow-xl"
                >
                    {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Wallet className="mr-2 h-5 w-5" />}
                    {hasSufficientFunds ? `Confirm & Activate Plan` : 'Top-up Required'}
                </Button>
                
                {!hasSufficientFunds && (
                    <Button asChild variant="outline" className="w-full h-12 font-bold">
                        <Link href="/account?view=wallet">Go to Wallet to Top-up</Link>
                    </Button>
                )}
                
                <Button variant="ghost" className="text-xs text-muted-foreground font-bold uppercase tracking-widest" asChild>
                    <Link href="/pricing">Cancel and go back</Link>
                </Button>
            </CardFooter>
        </Card>
    </div>
  );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
            <CheckoutComponent />
        </Suspense>
    );
}
