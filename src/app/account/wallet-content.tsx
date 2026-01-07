'use client';

import { useUser, useFirestore, useCollection, useDoc, getClientSideAuthToken } from '@/firebase/provider';
import { useMemoFirebase } from '@/hooks/use-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Loader2, DollarSign, Wallet, Clock, Info, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { format, formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useConfig } from '@/hooks/use-config';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import PayServicesDialog from './pay-services-dialog';


const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
};

const formatDate = (timestamp: any) => {
    if (timestamp && timestamp.toDate) {
        return format(timestamp.toDate(), "dd MMM yyyy, HH:mm");
    }
     if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
             return format(date, "dd MMM yyyy, HH:mm");
        }
    }
    return 'N/A';
};

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  pending_allocation: 'secondary',
  allocated: 'default',
  reversal: 'destructive',
  pending: 'secondary',
};

export default function WalletContent() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState<string>('');

    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userData, isLoading: isUserDocLoading } = useDoc<{ companyId: string }>(userDocRef);

    const companyDocRef = useMemoFirebase(() => {
        if (!firestore || !userData?.companyId) return null;
        return doc(firestore, 'companies', userData.companyId);
    }, [firestore, userData]);
    const { data: companyData, isLoading: isCompanyLoading, forceRefresh: forceRefreshCompany } = useDoc(companyDocRef);

    const transactionsQuery = useMemoFirebase(() => {
        if (!firestore || !userData?.companyId) return null;
        return query(
            collection(firestore, `companies/${userData.companyId}/transactions`), 
            orderBy('date', 'desc'), 
            limit(5)
        );
    }, [firestore, userData]);

    const pendingPaymentsQuery = useMemoFirebase(() => {
        if (!firestore || !userData?.companyId) return null;
        return query(
            collection(firestore, `companies/${userData.companyId}/walletPayments`),
            orderBy('createdAt', 'desc'),
            limit(5)
        );
    }, [firestore, userData]);
    
    const { data: techPricing, isLoading: isTechPricingLoading } = useConfig<{ eftTopUpFee?: number }>('techPricing');
    const { data: bankDetails, isLoading: isBankDetailsLoading } = useConfig<any>('bankDetails');

    const { data: transactions, isLoading: isLoadingTransactions, error: transactionsError } = useCollection(transactionsQuery);
    const { data: pendingPayments, isLoading: isLoadingPayments, error: paymentsError, forceRefresh: forceRefreshPayments } = useCollection(pendingPaymentsQuery);

    const isLoading = isUserLoading || isUserDocLoading || isCompanyLoading || isLoadingTransactions || isLoadingPayments || isTechPricingLoading || isBankDetailsLoading;
    const error = transactionsError || paymentsError;

    const unallocatedTotal = pendingPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const recentTransactionsTotal = transactions?.reduce((sum, tx) => {
        const amount = tx.type === 'credit' ? tx.amount : -tx.amount;
        return sum + amount;
    }, 0) || 0;
    
    const handleSubmitProofOfPayment = async () => {
        if (!user || !userData?.companyId) return;
        const amountValue = parseFloat(paymentAmount);
        if (isNaN(amountValue) || amountValue <= 0) {
            toast({ variant: 'destructive', title: "Invalid Amount", description: "Please enter a valid payment amount."});
            return;
        }

        setIsSubmitting(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed");
            
            const paymentData = {
                userId: user.uid,
                companyId: userData.companyId,
                status: 'pending',
                description: 'Wallet Top-up via EFT',
                amount: amountValue,
                createdAt: { _methodName: 'serverTimestamp' },
            };
            
            const response = await fetch('/api/createWalletPayment', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: paymentData }),
            });

            if (!response.ok) throw new Error((await response.json()).error || 'Failed to submit.');

            toast({ title: "Proof Submitted!", description: "An admin will review and credit your wallet shortly."});
            setPaymentAmount('');
            forceRefreshPayments(); // Refresh the list of pending payments
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
                    <div className="flex justify-between items-center">
                         <div>
                            <p className="text-sm text-muted-foreground">Current Allocated Balance</p>
                            {isCompanyLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin mt-1" />
                            ) : (
                                <p className="text-3xl font-bold">{formatCurrency(companyData?.walletBalance || 0)}</p>
                            )}
                        </div>
                        {companyData && (
                            <PayServicesDialog member={companyData} onPaymentSuccess={forceRefreshCompany} />
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                     <h3 className="text-lg font-semibold">Top-up via EFT</h3>
                     <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>How to Top Up</AlertTitle>
                        <AlertDescription>
                           To add funds, make an EFT payment to the bank details below using your Company ID as the reference. Then, enter the amount and click "I've made a payment" to notify us.
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
                             ) : bankDetails && userData?.companyId ? (
                                <>
                                    {Object.entries(bankDetails).filter(([key]) => !['id', 'updatedAt'].includes(key)).map(([key, value]) => (
                                        <div key={key} className="flex justify-between">
                                            <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                            <span className="font-mono">{String(value)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between pt-2 border-t">
                                        <span className="text-muted-foreground">Reference</span>
                                        <span className="font-mono text-primary">{userData.companyId}</span>
                                    </div>
                                </>
                            ) : (
                                <p className="text-muted-foreground text-center">Bank details not configured or user not loaded.</p>
                            )}
                         </CardContent>
                     </Card>
                     <div className="flex flex-col sm:flex-row gap-4 items-end">
                         <div className="w-full sm:w-auto flex-grow">
                             <Label htmlFor="payment-amount">Payment Amount (R)</Label>
                            <Input 
                                id="payment-amount"
                                type="number" 
                                placeholder="500.00"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                            />
                         </div>
                         <Button onClick={handleSubmitProofOfPayment} disabled={isSubmitting || !paymentAmount}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            I've made a payment
                         </Button>
                     </div>
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
                        {/* Section for Unallocated/Pending Payments */}
                        <div>
                            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2">
                                <Clock className="h-4 w-4" />
                                Unallocated Payments
                            </h3>
                            {pendingPayments && pendingPayments.length > 0 ? (
                                <div className="border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date Logged</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pendingPayments.map((payment) => (
                                                <TableRow key={payment.id} className="bg-muted/30">
                                                    <TableCell className="text-muted-foreground text-xs">{formatDate(payment.createdAt)}</TableCell>
                                                    <TableCell>
                                                        <p className="font-medium capitalize">{payment.description.replace(/_/g, ' ')}</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">Pending Approval</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono font-semibold">
                                                        {formatCurrency(payment.amount)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                        <TableFooter>
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-right font-semibold">Sub-Total of Pending Payments</TableCell>
                                                <TableCell className="text-right font-bold text-lg">{formatCurrency(unallocatedTotal)}</TableCell>
                                            </TableRow>
                                        </TableFooter>
                                    </Table>
                                </div>
                             ) : (
                                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                                    <p className="text-muted-foreground">You have no pending payments awaiting allocation.</p>
                                </div>
                            )}
                        </div>
                        
                        {/* Section for Allocated/Completed Transactions */}
                        <div>
                             <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2">
                                <DollarSign className="h-4 w-4" />
                                Recent Allocated Transactions
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
                                         <TableFooter>
                                            <TableRow>
                                                <TableCell colSpan={2} className="text-right font-semibold">Net Change from Recent Transactions</TableCell>
                                                <TableCell className="text-right font-bold text-lg">{formatCurrency(recentTransactionsTotal)}</TableCell>
                                            </TableRow>
                                        </TableFooter>
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
