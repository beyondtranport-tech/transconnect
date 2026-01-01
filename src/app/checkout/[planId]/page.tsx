
'use client';

import { Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { doc, getDoc, writeBatch, collection, serverTimestamp } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Banknote, ClipboardCopy } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
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
  const [userBalance, setUserBalance] = useState(0);
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);

  const planId = params.planId as string;
  const cycle = searchParams.get('cycle') || 'monthly';
  
  const planRef = useMemoFirebase(() => {
      if (!firestore || !planId) return null;
      return doc(firestore, 'memberships', planId);
  }, [firestore, planId]);
  
  const { data: plan, isLoading: isPlanLoading } = useDoc(planRef);

  const { data: bankDetails, isLoading: isBankDetailsLoading } = useConfig<any>('bankDetails');

  const memberRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'members', user.uid);
  }, [firestore, user]);
  
  const price = useMemo(() => {
    if (!plan) return 0;
    if (cycle === 'annual') {
        const annualPrice = plan.price.annual || 0;
        return annualPrice > 0 ? annualPrice : plan.price.monthly * 12 * (1 - (plan.annualDiscount || 0) / 100);
    }
    return plan.price.monthly;
  }, [plan, cycle]);


  const fetchBalance = useCallback(async () => {
    if (memberRef) {
      setIsBalanceLoading(true);
      try {
        const docSnap = await getDoc(memberRef);
        if (docSnap.exists()) {
          setUserBalance(docSnap.data().walletBalance || 0);
        }
      } catch (e) {
        console.error("Failed to fetch user balance:", e);
      } finally {
        setIsBalanceLoading(false);
      }
    }
  }, [memberRef]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push(`/signin?redirect=/checkout/${planId}?cycle=${cycle}`);
    } else {
        fetchBalance();
    }
  }, [user, isUserLoading, router, planId, cycle, fetchBalance]);
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
        toast({ title: "Copied!", description: `${text} copied to clipboard.`})
    });
  };

  const handlePurchaseWithWallet = async () => {
    if (!user || !firestore || !plan || userBalance < price) {
        toast({ variant: 'destructive', title: 'Error', description: 'Insufficient balance or user/plan not found.' });
        return;
    }
    setIsProcessing(true);
    
    const batch = writeBatch(firestore);
    
    // 1. Update member's balance and membership
    const memberDocRef = doc(firestore, 'members', user.uid);
    const newBalance = userBalance - price;

    const now = new Date();
    const nextBillingDate = new Date(now);
    if(cycle === 'monthly') {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    } else {
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    }

    const memberUpdateData = { 
        membershipId: plan.id, 
        walletBalance: newBalance,
        membershipStartDate: serverTimestamp(),
        billingCycle: cycle,
        nextBillingDate: nextBillingDate
    };
    batch.update(memberDocRef, memberUpdateData);

    // 2. Create a transaction record in the member's transactions subcollection
    const transactionRef = doc(collection(firestore, `members/${user.uid}/transactions`));
    const transactionData = {
        memberId: user.uid,
        type: 'debit',
        amount: price,
        date: serverTimestamp(),
        description: `Membership payment: ${plan.name} (${cycle})`,
        status: 'allocated',
        chartOfAccountsCode: '4010', // Example code for membership fees
        isAdjustment: false,
        postedBy: 'system',
        postedAt: serverTimestamp(),
        transactionId: transactionRef.id
    };
    batch.set(transactionRef, transactionData);
    
    try {
        await batch.commit();
        toast({ title: 'Upgrade Successful!', description: `Your membership is now ${plan.name}.` });
        router.push('/account');
    } catch (serverError) {
        const permissionError = new FirestorePermissionError({
            path: memberDocRef.path,
            operation: 'update',
            requestResourceData: { memberUpdate: memberUpdateData, transaction: transactionData },
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: 'destructive', title: 'Upgrade Failed', description: 'Permission denied.' });
    } finally {
        setIsProcessing(false);
    }
  };

  if (isUserLoading || !user || isBalanceLoading || isPlanLoading || isBankDetailsLoading) {
      return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!plan) {
    return <div className="text-center"><h2 className="text-2xl font-bold">Plan Not Found</h2><Button asChild className="mt-4"><Link href="/pricing">View Plans</Link></Button></div>;
  }

  const hasSufficientBalance = userBalance >= price;

  return (
    <Card className="w-full max-w-2xl">
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
             <div className="flex justify-between items-center mt-2 border-t pt-2">
                <p className="font-medium">Your Current Wallet Balance</p>
                <p className={`font-bold text-lg ${hasSufficientBalance ? 'text-green-600' : 'text-destructive'}`}>{formatPrice(userBalance)}</p>
            </div>
        </div>

        {hasSufficientBalance ? (
             <div className="text-center">
                 <p className="text-muted-foreground mb-4">You have enough funds in your wallet to complete this purchase.</p>
                <Button onClick={handlePurchaseWithWallet} disabled={isProcessing} className="w-full">
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Banknote className="mr-2 h-4 w-4" />}
                    Pay with Wallet ({formatPrice(price)})
                </Button>
            </div>
        ) : (
             <div>
                <h3 className="font-semibold text-lg text-center text-destructive">Insufficient Balance</h3>
                <p className="text-muted-foreground text-center mt-2 mb-6">Please top up your wallet by making an EFT payment using the details below. Your balance will be updated by an admin once payment is confirmed.</p>
                <Card className="bg-background">
                    <CardHeader>
                        <CardTitle>EFT Payment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                         {bankDetails ? (
                            <>
                                {Object.entries(bankDetails).filter(([key]) => !['id', 'updatedAt'].includes(key)).map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <span className="font-mono">{String(value)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center text-sm pt-3 border-t">
                                    <span className="text-muted-foreground">Reference</span>
                                    <button onClick={() => copyToClipboard(user.uid)} className="font-mono text-primary hover:underline flex items-center gap-2">
                                        {user.uid}
                                        <ClipboardCopy className="h-4 w-4"/>
                                    </button>
                                </div>
                            </>
                         ) : (
                            <p className="text-sm text-muted-foreground">Bank details are not configured.</p>
                         )}
                    </CardContent>
                </Card>
                 <Button onClick={() => fetchBalance()} className="w-full mt-6" variant="outline">
                    I've made the payment, refresh balance
                </Button>
            </div>
        )}
      </CardContent>
       <CardFooter className="flex flex-col items-center justify-center text-xs text-muted-foreground pt-4">
            <p>Wallet balance is manually updated by an administrator after EFT is confirmed.</p>
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
