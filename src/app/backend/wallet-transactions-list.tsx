
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Loader2, DollarSign, Clock, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCollection, useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/hooks/use-config';
import { collection, query, collectionGroup } from 'firebase/firestore';

interface Company {
    id: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    ownerId?: string;
}

interface Payment {
    id: string;
    companyId: string;
    amount: number;
    description: string;
    createdAt: any;
    memberName?: string;
    status: 'pending' | 'approved' | 'rejected';
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
    const firestore = useFirestore();

    const companiesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'companies')) : null, [firestore]);
    const paymentsQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'walletPayments')) : null, [firestore]);
    const transactionsQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'transactions')) : null, [firestore]);

    const { data: companies, isLoading: isLoadingCompanies } = useCollection<Company>(companiesQuery);
    const { data: pendingPayments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsQuery);
    const { data: allocatedTransactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery);

    const isLoading = isLoadingCompanies || isLoadingPayments || isLoadingTransactions;

    const companyMap = useMemo(() => {
        if (!companies) return new Map();
        return new Map(companies.map((c: Company) => [c.id, c]));
    }, [companies]);

    const enhancedPayments = useMemo(() => {
        if (!pendingPayments || !companyMap) return [];
        return pendingPayments
            .filter(p => p.status === 'pending')
            .map(p => {
                const company = companyMap.get(p.companyId);
                return { ...p, memberName: company?.companyName || 'Unknown Member' };
            })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [pendingPayments, companyMap]);

    const enhancedTransactions = useMemo(() => {
        if (!allocatedTransactions || !companyMap) return [];
        return allocatedTransactions
            .map(tx => {
                const company = companyMap.get(tx.companyId);
                return { ...tx, memberName: company?.companyName || 'Unknown Member' };
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [allocatedTransactions, companyMap]);


    const unallocatedTotal = enhancedPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

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
                    ) : enhancedPayments && enhancedPayments.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date Logged</TableHead>
                                    <TableHead>Company Name</TableHead>
                                    <TableHead>Company ID</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {enhancedPayments.map(p => (
                                    <TableRow key={p.id} className="bg-amber-50 dark:bg-amber-900/20">
                                        <TableCell>{formatDate(p.createdAt)}</TableCell>
                                        <TableCell className="font-medium">{p.memberName}</TableCell>
                                        <TableCell className="font-mono text-xs">{p.companyId}</TableCell>
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
                                    <TableCell colSpan={5} className="text-right font-bold">Total Pending Allocation</TableCell>
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
                    ) : enhancedTransactions && enhancedTransactions.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Company Name</TableHead>
                                    <TableHead>Company ID</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {enhancedTransactions.slice(0, 20).map(tx => ( // Show latest 20
                                    <TableRow key={tx.id}>
                                        <TableCell>{formatDate(tx.date)}</TableCell>
                                        <TableCell className="font-medium">{tx.memberName}</TableCell>
                                        <TableCell className="font-mono text-xs">{tx.companyId}</TableCell>
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
