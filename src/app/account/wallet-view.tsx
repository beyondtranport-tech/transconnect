'use client';

import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy, DocumentData } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ClipboardCopy, ArrowUp, ArrowDown, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import bankDetailsData from '@/lib/bank-details.json';

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  pending: 'secondary',
  under_review: 'outline',
  matched: 'default',
  rejected: 'destructive',
  funded: 'default',
  completed: 'default',
  membership_payment: 'outline',
};

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(price);
};

export default function WalletView() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    const transactionsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'transactions'),
            where('memberId', '==', user.uid),
            orderBy('date', 'desc')
        );
    }, [firestore, user]);

    const { data: transactions, isLoading: isLoadingTransactions } = useCollection(transactionsQuery);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({ title: "Copied!", description: `${text} copied to clipboard.`})
        });
    };

    const formatDate = (timestamp: any) => {
        if (timestamp && timestamp.toDate) {
            return format(timestamp.toDate(), "yyyy-MM-dd HH:mm");
        }
        return 'N/A';
    };
    
    const getTransactionType = (tx: DocumentData) => {
        const type = tx.chartOfAccountsCode || tx.fundingType || 'general';
        return type.replace(/_/g, ' ').replace(/\b\w/g, (l:string) => l.toUpperCase());
    };
    
    const getAmount = (tx: DocumentData) => {
        const amount = tx.amount || 0;
        if (tx.type === 'credit') {
            return `+ ${formatPrice(amount)}`;
        }
        return `- ${formatPrice(Math.abs(amount))}`;
    }
    
    const getAmountClass = (tx: DocumentData) => {
        if (tx.type === 'credit') {
            return 'text-green-600';
        }
        return 'text-destructive';
    }

    const safeBankDetails = bankDetailsData || {};

    return (
        <div className="w-full space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Top up your Wallet</CardTitle>
                    <CardDescription>
                        To add funds, make an EFT payment using the details below. Your balance will be updated once payment is confirmed by an administrator.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                         {Object.entries(safeBankDetails).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <span className="font-mono">{value}</span>
                            </div>
                        ))}
                        {user && (
                            <div className="flex justify-between items-center text-sm pt-3 border-t">
                                <span className="text-muted-foreground font-semibold">Your Payment Reference</span>
                                 <button onClick={() => copyToClipboard(user.uid)} className="font-mono text-primary hover:underline flex items-center gap-2">
                                    {user.uid}
                                    <ClipboardCopy className="h-4 w-4"/>
                                </button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Wallet History</CardTitle>
                    <CardDescription>A history of your credit top-up requests and other transactions.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingTransactions && (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}
                    
                    {!isLoadingTransactions && transactions && (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Reference</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map(tx => (
                                        <TableRow key={tx.id}>
                                            <TableCell>{formatDate(tx.date)}</TableCell>
                                            <TableCell className="font-mono text-xs">{tx.transactionId}</TableCell>
                                            <TableCell className="capitalize">{tx.description}</TableCell>
                                            <TableCell className={`text-right font-mono ${getAmountClass(tx)}`}>{getAmount(tx)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                     {transactions && transactions.length === 0 && !isLoadingTransactions && (
                        <p className="text-center text-muted-foreground py-10">You have no wallet transactions yet.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
