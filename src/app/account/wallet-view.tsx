
'use client';

import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ClipboardCopy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import bankDetailsData from '@/lib/bank-details.json';
import { useState, useEffect } from 'react';
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

function WalletHistory() {
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

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="text-center py-10 text-destructive">
                <p>Error loading transaction history: {error.message}</p>
            </div>
        );
    }

    return (
        <>
            {transactions && transactions.length > 0 ? (
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
                <p className="text-center text-muted-foreground py-10">You have no transaction history yet.</p>
            )}
        </>
    );
}

export default function WalletView() {
    const { user } = useUser();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({ title: "Copied!", description: `${text} copied to clipboard.`})
        });
    };

    const safeBankDetails = bankDetailsData || {};

    if (user && user.email === 'transconnect@gmail.com') {
        return null;
    }

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
                    <WalletHistory />
                </CardContent>
            </Card>
        </div>
    );
}
