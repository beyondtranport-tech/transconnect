'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  pending_allocation: 'secondary',
  allocated: 'default',
  reversal: 'destructive',
};

const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
};

const formatDate = (dateValue: any) => {
    if (dateValue && typeof dateValue.toDate === 'function') {
        return new Date(dateValue.toDate()).toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'short' });
    }
    return 'N/A';
};

export default function MemberTransactions({ companyId }: { companyId: string }) {
    const [transactions, setTransactions] = useState<any[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const firestore = useFirestore();

    useEffect(() => {
        if (!firestore) return;
        setIsLoading(true);

        const transactionsRef = collection(firestore, `companies/${companyId}/transactions`);
        const q = query(transactionsRef, orderBy('date', 'desc'));

        const unsubscribe = onSnapshot(q, 
            (querySnapshot) => {
                const txs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setTransactions(txs);
                setIsLoading(false);
            },
            (err) => {
                console.error("Error fetching member transactions:", err);
                setError(err);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [firestore, companyId]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><DollarSign /> Wallet Transaction History</CardTitle>
                <CardDescription>A real-time view of this member's wallet ledger.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading && (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                {error && (
                    <div className="text-destructive-foreground bg-destructive/90 p-4 rounded-md">
                        <h4 className="font-semibold">Error</h4>
                        <p className="text-sm">{error.message}</p>
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
                                {transactions.map(tx => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="text-xs">{formatDate(tx.date)}</TableCell>
                                        <TableCell>{tx.description}</TableCell>
                                        <TableCell>
                                            <Badge variant={statusColors[tx.status] || 'secondary'} className="capitalize">
                                                {tx.status?.replace(/_/g, ' ')}
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
                        <div className="text-center py-10 text-muted-foreground">
                            <p>No wallet transactions found for this member.</p>
                        </div>
                    )
                )}
            </CardContent>
        </Card>
    );
}
