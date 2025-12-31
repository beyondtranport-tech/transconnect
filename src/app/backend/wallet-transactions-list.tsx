
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, DollarSign, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';

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
    return result;
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
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const { toast } = useToast();

    async function fetchAllTransactions() {
        // Don't set loading to true here to avoid flicker on re-fetch
        try {
            const [transactionsResult, membersResult] = await Promise.all([
                fetchFromAdminAPI('getAllTransactions'),
                fetchFromAdminAPI('getMembers')
            ]);

            const memberMap = new Map(membersResult.data.map((m: any) => [m.id, `${m.firstName} ${m.lastName}`]));
            
            const transactionsWithNames = transactionsResult.data.map((tx: any) => ({
                ...tx,
                memberName: memberMap.get(tx.memberId) || 'Unknown Member'
            }));

            setTransactions(transactionsWithNames as Transaction[]);
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        setIsLoading(true);
        fetchAllTransactions();
    }, []);
    
    const handleDelete = async (memberId: string, transactionId: string) => {
        setIsDeleting(transactionId);
        try {
            await fetchFromAdminAPI('deleteTransaction', { memberId, transactionId });
            toast({ title: 'Transaction Deleted' });
            fetchAllTransactions(); // Re-fetch data to update the list
        } catch(e: any) {
            toast({ variant: 'destructive', title: 'Deletion Failed', description: e.message });
        }
        setIsDeleting(null);
    };

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
                                        <TableHead className="text-right">Actions</TableHead>
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
                                            <TableCell className="text-right">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" disabled={isDeleting === tx.id}>
                                                            {isDeleting === tx.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete this transaction record.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(tx.memberId, tx.id)} className="bg-destructive hover:bg-destructive/90">
                                                                Yes, delete it
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
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
