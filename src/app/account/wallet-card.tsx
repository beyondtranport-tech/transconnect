
'use client';

import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, DollarSign, Wallet, Clock, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useConfig } from '@/hooks/use-config';
import { getClientSideAuthToken } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
};

const formatDate = (timestamp: any) => {
    if (timestamp && timestamp.toDate) {
        return format(timestamp.toDate(), "dd MMM yyyy, HH:mm");
    }
    return 'N/A';
};

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  pending_allocation: 'secondary',
  allocated: 'default',
  reversal: 'destructive',
  pending: 'secondary',
};

export default function WalletCard() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const memberRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'members', user.uid);
    }, [firestore, user]);

    const { data: memberData, isLoading: isMemberLoading } = useDoc(memberRef);

    const transactionsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'members', user.uid, 'transactions'), 
            orderBy('date', 'desc'), 
            limit(5)
        );
    }, [firestore, user]);

    const pendingPaymentsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'members', user.uid, 'walletPayments'),
            orderBy('createdAt', 'desc'),
            limit(5)
        );
    }, [firestore, user]);
    
    const { data: techPricing, isLoading: isTechPricingLoading } = useConfig<{ eftTopUpFee?: number }>('techPricing');
    const { data: bankDetails, isLoading: isBankDetailsLoading } = useConfig<any>('bankDetails');

    const { data: transactions, isLoading: isLoadingTransactions, error: transactionsError } = useCollection(transactionsQuery);
    const { data: pendingPayments, isLoading: isLoadingPayments, error: paymentsError } = useCollection(pendingPaymentsQuery);

    const isLoading = isLoadingTransactions || isLoadingPayments || isMemberLoading || isTechPricingLoading || isBankDetailsLoading;
    const error = transactionsError || paymentsError;

    if (user && user.email === 'beyondtransport@gmail.com') {
        return null;
    }
    
    const handleSubmitProofOfPayment = async () => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed");
            
            // This is a placeholder for the actual amount. In a real app,
            // we'd have a form for the user to enter the amount.
            const paymentAmount = 0; // We'll need a form for this.
            
            const paymentData = {
                applicantId: user.uid,
                status: 'pending',
                description: 'Wallet Top-up via EFT',
                amount: paymentAmount, // This would come from a user input field
                createdAt: { _methodName: 'serverTimestamp' },
            };
            
            const response = await fetch('/api/createWalletPayment', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: paymentData })
            });

            if (!response.ok) throw new Error((await response.json()).error || 'Failed to submit.');

            toast({ title: "Proof Submitted!", description: "An admin will review and credit your wallet shortly."});
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Submission Failed", description: e.message });
        } finally {
            setIsSubmitting(false);
        }
    }


    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                   <Wallet className="h-6 w-6" />
                   My Wallet
                </CardTitle>
                <CardDescription>Your wallet balance, recent transactions, and pending payments.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    {isMemberLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin mt-1" />
                    ) : (
                        <p className="text-3xl font-bold">{formatCurrency(memberData?.walletBalance || 0)}</p>
                    )}
                </div>

                <div className="space-y-4">
                     <h3 className="text-lg font-semibold">Top-up via EFT</h3>
                     <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>How to Top Up</AlertTitle>
                        <AlertDescription>
                           To add funds, make an EFT payment to the bank details below using your Member ID as the reference.
                           {techPricing?.eftTopUpFee && techPricing.eftTopUpFee > 0 && (
                                <span className="font-semibold block mt-2">Please note: A {formatCurrency(techPricing.eftTopUpFee)} admin fee applies to EFT top-ups.</span>
                           )}
                        </AlertDescription>
                     </Alert>
                     <Card className="bg-background">
                         <CardContent className="p-4 text-sm space-y-2">
                             {isBankDetailsLoading ? (
                                <div className="flex justify-center p-4">
                                    <Loader2 className="h-6 w-6 animate-spin"/>
                                </div>
                             ) : bankDetails ? (
                                <>
                                    {Object.entries(bankDetails).filter(([key]) => !['id', 'updatedAt'].includes(key)).map(([key, value]) => (
                                        <div key={key} className="flex justify-between">
                                            <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                            <span className="font-mono">{String(value)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between pt-2 border-t">
                                        <span className="text-muted-foreground">Reference</span>
                                        <span className="font-mono text-primary">{user?.uid}</span>
                                    </div>
                                </>
                            ) : (
                                <p className="text-muted-foreground text-center">Bank details not configured.</p>
                            )}
                         </CardContent>
                     </Card>
                     <Button onClick={handleSubmitProofOfPayment} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        I've made a payment
                     </Button>
                </div>

                {isLoading && (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                
                {error && (
                    <div className="text-center py-10 text-destructive">
                        <p>Error loading wallet data: {error.message}</p>
                    </div>
                )}

                {!isLoading && (
                    <div className="space-y-8">
                        {/* Section for Pending Payments */}
                        {pendingPayments && pendingPayments.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2">
                                    <Clock className="h-4 w-4" />
                                    Pending Payments
                                </h3>
                                <div className="border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pendingPayments.map((payment) => (
                                                <TableRow key={payment.id} className="bg-muted/30">
                                                    <TableCell className="text-muted-foreground text-xs">{formatDate(payment.createdAt)}</TableCell>
                                                    <TableCell>
                                                        <p className="font-medium capitalize">{payment.description.replace(/_/g, ' ')}</p>
                                                        <Badge variant="secondary" className="mt-1">Pending Approval</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono font-semibold">
                                                        {formatCurrency(payment.amount)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                        
                        {/* Section for Completed Transactions */}
                        <div>
                             <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2">
                                <DollarSign className="h-4 w-4" />
                                Recent Transactions
                            </h3>
                             {transactions && transactions.length > 0 ? (
                                <div className="border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {transactions.map((tx) => (
                                                <TableRow key={tx.id}>
                                                    <TableCell className="text-muted-foreground text-xs">{formatDate(tx.date)}</TableCell>
                                                    <TableCell>
                                                        <p className="font-medium">{tx.description}</p>
                                                    </TableCell>
                                                    <TableCell className={`text-right font-mono font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-destructive'}`}>
                                                        {tx.type === 'credit' ? '+' : '-'} {formatCurrency(tx.amount)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                                    <p className="text-muted-foreground">You have no completed transactions yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                 <Button variant="outline" asChild>
                    <Link href="/account?view=billing">View Full Transaction History</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
