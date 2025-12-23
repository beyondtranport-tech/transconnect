'use client';

import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { DocumentData } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(price);
};

const formatDate = (timestamp: any) => {
    if (timestamp && timestamp.toDate) {
        return format(timestamp.toDate(), "yyyy-MM-dd");
    }
    return 'N/A';
};

const getAmountClass = (tx: DocumentData) => {
    return tx.type === 'credit' ? 'text-green-600' : 'text-destructive';
}

const getAmount = (tx: DocumentData) => {
    const amount = tx.amount || 0;
    if (tx.type === 'credit') {
        return `+ ${formatPrice(amount)}`;
    }
    return `- ${formatPrice(Math.abs(amount))}`;
};

export default function RecentTransactions() {
    const firestore = useFirestore();
    const { user } = useUser();

    // Prevent this component from running queries for the admin user.
    // The admin is redirected away from the page that uses this, but the query
    // can fire before the redirect is complete, causing a permission error.
    const isReadyToQuery = !!(firestore && user && user.email !== 'transconnect@gmail.com');

    const transactionsQuery = useMemoFirebase(() => {
        if (!isReadyToQuery) return null;
        return query(
            collection(firestore, 'transactions'),
            where('memberId', '==', user.uid),
            orderBy('date', 'desc'),
            limit(5)
        );
    }, [isReadyToQuery, firestore, user]);

    const { data: transactions, isLoading: isLoadingTransactions } = useCollection(transactionsQuery);
    
    // If the user is an admin, render nothing. This is the crucial guard.
    if (user && user.email === 'transconnect@gmail.com') {
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
                {isLoadingTransactions && (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                
                {!isLoadingTransactions && transactions && transactions.length > 0 && (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map(tx => (
                                    <TableRow key={tx.id}>
                                        <TableCell>{formatDate(tx.date)}</TableCell>
                                        <TableCell className="capitalize">{tx.description}</TableCell>
                                        <TableCell className={`text-right font-mono ${getAmountClass(tx)}`}>{getAmount(tx)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
                 {transactions && transactions.length === 0 && !isLoadingTransactions && (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground">You have no transactions yet.</p>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                 <Button variant="outline" asChild>
                    <Link href="/account?view=wallet">View All Transactions</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
