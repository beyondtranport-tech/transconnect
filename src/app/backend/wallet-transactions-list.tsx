
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Loader2, DollarSign, Clock, ArrowRight, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';

interface Member {
    id: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
}

interface Payment {
    id: string;
    applicantId: string;
    amount: number;
    description: string;
    createdAt: any; // Can be Timestamp or string
    memberName?: string;
}

interface Transaction {
    id: string;
    memberId: string;
    type: 'credit' | 'debit';
    amount: number;
    description: string;
    date: any; // Can be Timestamp or string
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

async function fetchSubcollectionForMember(memberId: string, subcollection: 'walletPayments' | 'transactions') {
    const token = await getClientSideAuthToken();
    if (!token) throw new Error("Authentication failed.");
     const response = await fetch('/api/getUserSubcollection', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: `members/${memberId}/${subcollection}`, type: 'collection' }),
    });
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error || `Failed to fetch ${subcollection}`);
    }
    return result.data;
}


const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
};

const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A';
    // Handle Firestore Timestamp object
    if (typeof dateValue.toDate === 'function') {
      return dateValue.toDate().toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'short' });
    }
    // Handle ISO string
    if (typeof dateValue === 'string') {
        try {
            return new Date(dateValue).toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'short' });
        } catch (e) {
            return 'Invalid Date';
        }
    }
    return 'Invalid Date';
};

export default function WalletTransactionsList() {
    const [members, setMembers] = useState<Member[]>([]);
    const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
    const [allocatedTransactions, setAllocatedTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchAllWalletData() {
            setIsLoading(true);
            setError(null);
            try {
                const membersData = await fetchFromAdminAPI('getMembers');
                setMembers(membersData);

                let allPayments: Payment[] = [];
                let allTransactions: Transaction[] = [];

                for (const member of membersData) {
                    const memberName = `${member.firstName} ${member.lastName}`;
                    
                    const paymentsData = await fetchSubcollectionForMember(member.id, 'walletPayments');
                    if (paymentsData) {
                        allPayments.push(...paymentsData.map((p: any) => ({ ...p, memberName })));
                    }

                    const transactionsData = await fetchSubcollectionForMember(member.id, 'transactions');
                    if (transactionsData) {
                        allTransactions.push(...transactionsData.map((tx: any) => ({ ...tx, memberName })));
                    }
                }
                
                allPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                setPendingPayments(allPayments.filter(p => p.status === 'pending'));
                setAllocatedTransactions(allTransactions);

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
