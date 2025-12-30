
'use client';

import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, DollarSign, Wallet, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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

export default function RecentTransactions() {
    const { user } = useUser();
    const firestore = useFirestore();

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
            collection(firestore, 'members', user.uid, 'financeApplications'),
            where('status', 'in', ['membership_payment', 'wallet_top_up']),
            orderBy('createdAt', 'desc'),
            limit(5)
        );
    }, [firestore, user]);

    const { data: transactions, isLoading: isLoadingTransactions, error: transactionsError } = useCollection(transactionsQuery);
    const { data: pendingPayments, isLoading: isLoadingPayments, error: paymentsError } = useCollection(pendingPaymentsQuery);

    const isLoading = isLoadingTransactions || isLoadingPayments;
    const error = transactionsError || paymentsError;

    if (user && user.email === 'beyondtransport@gmail.com') {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                   <Wallet className="h-6 w-6" />
                   Wallet
                </CardTitle>
                <CardDescription>Your wallet balance, recent transactions, and pending payments.</CardDescription>
            </CardHeader>
            <CardContent>
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
                                                        <p className="font-medium capitalize">{payment.fundingType.replace(/_/g, ' ')}</p>
                                                        <Badge variant="secondary" className="mt-1">Pending Approval</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono font-semibold">
                                                        {formatCurrency(payment.amountRequested)}
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
                                Completed Transactions
                            </h3>
                             {transactions && transactions.length > 0 ? (
                                <div className="border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Status</TableHead>
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
                                                    <TableCell>
                                                        <Badge variant={statusColors[tx.status] || 'secondary'} className="capitalize">
                                                            {tx.status.replace(/_/g, ' ')}
                                                        </Badge>
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
                    <Link href="/account?view=transactions">View Full Wallet History</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
