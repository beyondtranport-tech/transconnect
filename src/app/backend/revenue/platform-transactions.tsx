
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Loader2, DollarSign } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { formatCurrency } from '@/lib/utils';
import { format as formatDateFns } from 'date-fns';

const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A';
    let date;
    if (typeof dateValue === 'string') {
        date = new Date(dateValue);
    } else if (dateValue.toDate && typeof dateValue.toDate === 'function') {
        date = dateValue.toDate();
    } else {
        return 'N/A';
    }

    if (isNaN(date.getTime())) return 'Invalid Date';
    return formatDateFns(date, 'dd MMM yyyy, HH:mm');
};

export default function PlatformTransactions() {
    const firestore = useFirestore();

    const transactionsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'platformTransactions'), orderBy('date', 'desc'));
    }, [firestore]);

    const { data: transactions, isLoading, error } = useCollection(transactionsQuery);

    const totalRevenue = useMemo(() => {
        if (!transactions) return 0;
        return transactions.reduce((sum, tx) => {
            if (tx.type === 'credit') {
                return sum + tx.amount;
            }
            // You might have debits later for refunds, etc.
            if (tx.type === 'debit') {
                return sum - tx.amount;
            }
            return sum;
        }, 0);
    }, [transactions]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Platform Revenue Ledger</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center items-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }
    
     if (error) {
        return (
            <Card>
                <CardHeader><CardTitle className="text-destructive">Error Loading Revenue</CardTitle></CardHeader>
                <CardContent><p>{error.message}</p></CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><DollarSign /> Platform Revenue Ledger</CardTitle>
                <CardDescription>A complete log of all revenue earned by the platform, such as commissions from sales.</CardDescription>
            </CardHeader>
            <CardContent>
                {transactions && transactions.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Account Code</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map(tx => (
                                <TableRow key={tx.id}>
                                    <TableCell>{formatDate(tx.date)}</TableCell>
                                    <TableCell>{tx.description}</TableCell>
                                    <TableCell className="font-mono text-xs">{tx.chartOfAccountsCode}</TableCell>
                                    <TableCell className={`text-right font-mono font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-destructive'}`}>
                                        {tx.type === 'credit' ? '+' : '-'} {formatCurrency(tx.amount)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={3} className="text-right font-bold text-lg">Total Revenue Logged</TableCell>
                                <TableCell className="text-right font-bold text-lg">{formatCurrency(totalRevenue)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-muted-foreground">No platform revenue has been recorded yet.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
