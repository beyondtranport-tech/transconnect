
'use client';

import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const formatCurrency = (amount: number) => {
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

    const { data: transactions, isLoading, error } = useCollection(transactionsQuery);

    // If the user is an admin, render nothing. This is a crucial guard.
    if (user && user.email === 'beyondtransport@gmail.com') {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                   <DollarSign className="h-6 w-6" />
                   Recent Transactions
                </CardTitle>
                <CardDescription>Your last 5 wallet transactions.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading && (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                
                {error && (
                    <div className="text-center py-10 text-destructive">
                        <p>Error loading transactions: {error.message}</p>
                    </div>
                )}

                {!isLoading && transactions && (
                    transactions.length > 0 ? (
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
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground">You have no transactions yet.</p>
                            <p className="text-sm text-muted-foreground">Payments you make will appear here.</p>
                        </div>
                    )
                )}
            </CardContent>
            <CardFooter>
                 <Button variant="outline" asChild>
                    <Link href="/account?view=transactions">View Full History</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
