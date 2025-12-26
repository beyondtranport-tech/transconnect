
'use client';

import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, DollarSign } from 'lucide-react';
import { collection, query, where, orderBy } from 'firebase/firestore';
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


export default function TransactionsContent() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    
    const transactionsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'transactions'),
            where('memberId', '==', user.uid),
            orderBy('date', 'desc')
        );
    }, [firestore, user]);
    
    const { data: transactions, isLoading: isTransactionsLoading, error } = useCollection(transactionsQuery);

    const isLoading = isUserLoading || isTransactionsLoading;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                   <DollarSign className="h-6 w-6" />
                   Transaction History
                </CardTitle>
                <CardDescription>A complete record of your wallet transactions.</CardDescription>
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
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="text-muted-foreground text-xs">{formatDate(tx.date)}</TableCell>
                                        <TableCell>
                                            <p className="font-medium">{tx.description}</p>
                                            {tx.isAdjustment && <Badge variant="outline">Adjustment</Badge>}
                                        </TableCell>
                                        <TableCell className={`text-right font-mono font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-destructive'}`}>
                                            {tx.type === 'credit' ? '+' : '-'} {formatCurrency(tx.amount)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     ) : (
                        <div className="text-center py-20">
                          <p className="text-muted-foreground">You have no transactions yet.</p>
                        </div>
                     )
                )}
            </CardContent>
        </Card>
    );
}

