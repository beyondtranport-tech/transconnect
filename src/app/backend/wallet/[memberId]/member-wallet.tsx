
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { DocumentData } from 'firebase/firestore';
import { useRouter } from 'next/navigation';


const formatCurrency = (amount: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);

const formatDate = (timestamp: any) => {
    if (typeof timestamp === 'string') return timestamp;
    if (timestamp && timestamp.toDate) return format(timestamp.toDate(), "yyyy-MM-dd HH:mm");
    return 'N/A';
};

interface MemberWalletProps {
    member: DocumentData;
    initialTransactions: DocumentData[];
}

export default function MemberWallet({ member, initialTransactions }: MemberWalletProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);
    
    // Calculate cumulative balance
    const openingBalanceRecord = {
        id: 'opening-balance',
        date: '2025-01-01 00:00',
        description: 'Opening Balance',
        transactionId: 'N/A',
        type: 'credit',
        amount: 0,
        _sortDate: new Date('2025-01-01T00:00:00Z'), 
    };

    const allRecords = [
        openingBalanceRecord, 
        ...initialTransactions.map(tx => ({...tx, _sortDate: tx.date.toDate()}))
    ];
    const sortedTransactions = allRecords.sort((a, b) => a._sortDate.getTime() - b._sortDate.getTime());

    let runningBalance = 0;
    const transactionsWithBalance = sortedTransactions.map(tx => {
        const amount = tx.amount === 0 ? 0 : (tx.type === 'credit' ? tx.amount : -tx.amount);
        runningBalance += amount;
        return { ...tx, runningBalance };
    }).reverse();

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl">Manage Wallet</CardTitle>
                    <CardDescription>
                        Viewing wallet for {member.firstName} {member.lastName} ({member.email})
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    {isMounted ? (
                        <p className="text-4xl font-bold">{formatCurrency(member.walletBalance || 0)}</p>
                    ) : (
                        <div className="h-12 w-48 bg-muted animate-pulse rounded-md" />
                    )}
                </CardContent>
                 <CardFooter>
                    <p className="text-xs text-muted-foreground">
                        To add a manual credit or debit, please use the "Manual Adjustment" feature on the main Reconciliation page.
                    </p>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>A complete log of all wallet transactions for this member, with a running balance.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isMounted ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Transaction ID</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactionsWithBalance.map(tx => (
                                    <TableRow key={tx.id}>
                                        <TableCell>{formatDate(tx.date)}</TableCell>
                                        <TableCell className="capitalize">{tx.description}</TableCell>
                                        <TableCell className="font-mono text-xs">{tx.transactionId}</TableCell>
                                        <TableCell className={`text-right font-mono ${tx.amount === 0 ? '' : tx.type === 'credit' ? 'text-green-600' : 'text-destructive'}`}>
                                            {tx.amount === 0 ? formatCurrency(0) : (tx.type === 'credit' ? `+${formatCurrency(tx.amount)}` : `-${formatCurrency(tx.amount)}`)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-semibold">{formatCurrency(tx.runningBalance)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}
                     {!isMounted && initialTransactions.length === 0 && (
                        <p className="text-center text-muted-foreground py-10">No transactions found for this member.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
