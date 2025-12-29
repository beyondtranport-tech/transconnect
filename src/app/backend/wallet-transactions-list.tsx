'use client';

import { useState, useEffect } from 'react';
import { getAllTransactions, getMembers } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Transaction {
    id: string;
    memberId: string;
    type: 'credit' | 'debit';
    amount: number;
    description: string;
    status: 'pending_allocation' | 'allocated' | 'reversal';
    date: string; // ISO string
    memberName?: string;
}

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  pending_allocation: 'secondary',
  allocated: 'default',
  reversal: 'destructive',
};

const formatPrice = (price: number) => {
    if (typeof price !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(price);
};

const formatDate = (isoString: string | undefined) => {
    if (!isoString) return 'N/A';
    try {
        return new Date(isoString).toLocaleString('en-ZA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'});
    } catch (e) {
        return 'Invalid Date';
    }
};

export default function WalletTransactionsList() {
    const [transactions, setTransactions] = useState<Transaction[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchAllTransactions() {
            setIsLoading(true);
            try {
                const [transactionsResult, membersResult] = await Promise.all([
                    getAllTransactions(),
                    getMembers()
                ]);

                if (transactionsResult.success && transactionsResult.data && membersResult.success && membersResult.data) {
                    const memberMap = new Map(membersResult.data.map(m => [m.id, `${m.firstName} ${m.lastName}`]));
                    
                    const transactionsWithNames = transactionsResult.data.map(tx => ({
                        ...tx,
                        memberName: memberMap.get(tx.memberId) || 'Unknown Member'
                    }));

                    setTransactions(transactionsWithNames as Transaction[]);
                } else {
                    setError(transactionsResult.error || membersResult.error || 'Failed to fetch data.');
                }
            } catch (e: any) {
                setError(e.message || 'An unexpected error occurred.');
            } finally {
                setIsLoading(false);
            }
        }

        fetchAllTransactions();
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>All Wallet Transactions</CardTitle>
                <CardDescription>A combined ledger of all transactions across all member wallets.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading && (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                {error && (
                     <div className="text-destructive-foreground bg-destructive/90 p-4 rounded-md">
                        <h4 className="font-semibold">Error loading transactions</h4>
                        <p className="text-sm">{error}</p>
                    </div>
                )}
                {transactions && !isLoading && (
                    transactions.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Member</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map(tx => (
                                        <TableRow key={tx.id}>
                                            <TableCell>{formatDate(tx.date)}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">{tx.memberName}</div>
                                                <div className="text-xs text-muted-foreground font-mono">{tx.memberId}</div>
                                            </TableCell>
                                            <TableCell>{tx.description}</TableCell>
                                            <TableCell>
                                                <Badge variant={statusColors[tx.status] || 'secondary'} className="capitalize">
                                                    {tx.status?.replace(/_/g, ' ') || 'N/A'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={`text-right font-mono font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-destructive'}`}>
                                                {tx.type === 'credit' ? '+' : '-'} {formatPrice(tx.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                         <p className="text-center text-muted-foreground py-10">
                            No transactions found across any member wallets yet.
                         </p>
                    )
                )}
            </CardContent>
        </Card>
    );
}
