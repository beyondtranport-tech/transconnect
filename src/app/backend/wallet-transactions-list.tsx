'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, DollarSign, Clock, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';

interface Member {
    id: string;
    firstName?: string;
    lastName?: string;
}

interface Payment {
    id: string;
    applicantId: string;
    amount: number;
    description: string;
    createdAt: string;
    memberName?: string;
}

interface Transaction {
    id: string;
    memberId: string;
    type: 'credit' | 'debit';
    amount: number;
    description: string;
    date: string; // ISO string
    memberName?: string;
}

async function fetchFromAdminAPI(action: string, payload?: any) {
    const token = await getClientSideAuthToken();
    if (!token) throw new Error("Authentication failed.");
    
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, payload }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error for action: ${action}`);
    }
    return result.data;
}

const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
};

const formatDate = (isoString: string | undefined) => {
    if (!isoString) return 'N/A';
    try {
        return new Date(isoString).toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'short' });
    } catch (e) {
        return 'Invalid Date';
    }
};

export default function WalletTransactionsList() {
    const [pendingPayments, setPendingPayments] = useState<Payment[] | null>(null);
    const [allocatedTransactions, setAllocatedTransactions] = useState<Transaction[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchAllWalletData() {
            setIsLoading(true);
            try {
                const [paymentsData, transactionsData, membersData] = await Promise.all([
                    fetchFromAdminAPI('getWalletPayments'),
                    fetchFromAdminAPI('getAllTransactions'),
                    fetchFromAdminAPI('getMembers')
                ]);

                const memberMap = new Map(membersData.map((m: Member) => [m.id, `${m.firstName} ${m.lastName}`]));

                const paymentsWithNames = paymentsData.map((p: Payment) => ({
                    ...p,
                    memberName: memberMap.get(p.applicantId) || 'Unknown Member'
                }));
                 const transactionsWithNames = transactionsData.map((tx: Transaction) => ({
                    ...tx,
                    memberName: memberMap.get(tx.memberId) || 'Unknown Member'
                }));
                
                transactionsWithNames.sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime());


                setPendingPayments(paymentsWithNames);
                setAllocatedTransactions(transactionsWithNames);

            } catch (e: any) {
                setError(e.message || 'An unexpected error occurred.');
            } finally {
                setIsLoading(false);
            }
        }

        fetchAllWalletData();
    }, []);

    const unallocatedTotal = pendingPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Clock /> Unallocated Payments</CardTitle>
                    <CardDescription>Member-submitted EFT payments awaiting verification and manual allocation.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : error ? (
                         <div className="text-destructive-foreground bg-destructive/90 p-4 rounded-md"><p>{error}</p></div>
                    ) : pendingPayments && pendingPayments.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date Logged</TableHead>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingPayments.map(p => (
                                    <TableRow key={p.id} className="bg-amber-50 dark:bg-amber-900/20">
                                        <TableCell>{formatDate(p.createdAt)}</TableCell>
                                        <TableCell className="font-medium">{p.memberName}</TableCell>
                                        <TableCell>{p.description}</TableCell>
                                        <TableCell className="font-semibold">{formatCurrency(p.amount)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button asChild size="sm" variant="outline">
                                                <Link href={`/backend?view=wallet&memberId=${p.applicantId}`}>
                                                    Reconcile <ArrowRight className="ml-2 h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={4} className="text-right font-bold">Total Pending Allocation</TableCell>
                                    <TableCell className="text-right font-bold text-lg">{formatCurrency(unallocatedTotal)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    ) : (
                        <p className="text-center text-muted-foreground py-10">No pending payments to allocate.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><DollarSign /> All Allocated Transactions</CardTitle>
                    <CardDescription>A combined ledger of all completed transactions across all member wallets.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                         <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : error ? (
                        <div className="text-destructive-foreground bg-destructive/90 p-4 rounded-md"><p>{error}</p></div>
                    ) : allocatedTransactions && allocatedTransactions.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allocatedTransactions.slice(0, 20).map(tx => ( // Show latest 20
                                    <TableRow key={tx.id}>
                                        <TableCell>{formatDate(tx.date)}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{tx.memberName}</div>
                                            <div className="text-xs text-muted-foreground font-mono">{tx.memberId}</div>
                                        </TableCell>
                                        <TableCell>{tx.description}</TableCell>
                                        <TableCell className={`text-right font-mono font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-destructive'}`}>
                                            {tx.type === 'credit' ? '+' : '-'} {formatCurrency(tx.amount)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                         <p className="text-center text-muted-foreground py-10">No allocated transactions found.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
