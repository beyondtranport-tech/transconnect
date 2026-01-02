
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Loader2, DollarSign, Clock, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getClientSideAuthToken } from '@/firebase';
import { useConfig } from '@/hooks/use-config';
import { useToast } from '@/hooks/use-toast';

interface Member {
    userId: string;
    companyId: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
}

interface Payment {
    id: string;
    userId: string;
    companyId: string;
    amount: number;
    description: string;
    createdAt: any;
    memberName?: string;
}

interface Transaction {
    id: string;
    companyId: string;
    type: 'credit' | 'debit';
    amount: number;
    description: string;
    date: any;
    memberName?: string;
}

async function fetchCollectionGroup(collectionId: string) {
    const token = await getClientSideAuthToken();
    if (!token) throw new Error("Authentication failed.");
    
    const response = await fetch('/api/getUserSubcollection', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: collectionId, type: 'collection-group' }),
    });

    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error || `Failed to fetch ${collectionId}`);
    }
    return result.data;
}

async function fetchMembers() {
    const token = await getClientSideAuthToken();
    if (!token) throw new Error("Authentication failed.");
    
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'getMembers' }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error for action: getMembers`);
    }
    return result.data;
}

const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
};

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
    return date.toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'short' });
};


export default function WalletTransactionsList() {
    const [memberMap, setMemberMap] = useState<Map<string, Member>>(new Map());
    const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
    const [allocatedTransactions, setAllocatedTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchAllWalletData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [membersData, paymentsData, transactionsData] = await Promise.all([
                fetchMembers(),
                fetchCollectionGroup('walletPayments'),
                fetchCollectionGroup('transactions')
            ]);

            const newMemberMap = new Map(membersData.map((m: Member) => [m.companyId, m]));
            setMemberMap(newMemberMap);

            if (paymentsData) {
                const enhancedPayments = paymentsData
                    .filter((p: any) => p.status === 'pending')
                    .map((p: any) => {
                        const member = newMemberMap.get(p.companyId);
                        const memberName = member ? `${member.firstName || ''} ${member.lastName || ''}`.trim() : p.companyId;
                        return {
                            ...p,
                            memberName: memberName || p.companyId
                        };
                    });
                enhancedPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setPendingPayments(enhancedPayments);
            }

            if (transactionsData) {
                 const enhancedTransactions = transactionsData.map((tx: any) => {
                    const member = newMemberMap.get(tx.companyId);
                    const memberName = member ? `${member.firstName || ''} ${member.lastName || ''}`.trim() : tx.companyId;
                    return {
                        ...tx,
                        memberName: memberName || tx.companyId
                    };
                });
                enhancedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setAllocatedTransactions(enhancedTransactions);
            }

        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllWalletData();
    }, [fetchAllWalletData]);

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
                                            <Button asChild size="sm" variant="default">
                                                <Link href={`/backend/approve-payment/${p.companyId}/${p.id}`}>
                                                    <CheckCircle className="mr-2 h-4 w-4"/>
                                                    Approve
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
                                            <div className="text-xs text-muted-foreground font-mono">{tx.companyId}</div>
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
