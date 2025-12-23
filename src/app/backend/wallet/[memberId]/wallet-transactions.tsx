
'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { DocumentData } from 'firebase/firestore';

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(price);
};

const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Staged';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, "yyyy-MM-dd HH:mm");
};

const getAmountClass = (tx: DocumentData) => {
    return tx.type === 'credit' ? 'text-green-600' : 'text-destructive';
}

const getAmount = (tx: DocumentData) => {
    const amount = tx.amount || 0;
    if (tx.type === 'credit') {
        return `+ ${formatPrice(amount)}`;
    }
    return `- ${formatPrice(Math.abs(amount))}`;
};

export default function WalletTransactions({ transactions, isLoading }: { transactions: DocumentData[], isLoading: boolean }) {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (transactions.length === 0) {
        return (
            <p className="text-center text-muted-foreground py-10">No transactions found for this member.</p>
        );
    }

    return (
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.map((tx, index) => (
                        <TableRow key={tx.id || `new-${index}`} className={!tx.id ? "bg-yellow-100/50 dark:bg-yellow-900/20" : ""}>
                            <TableCell>{formatDate(tx.date)}</TableCell>
                            <TableCell className="font-mono text-xs">{tx.transactionId}</TableCell>
                            <TableCell>{tx.chartOfAccountsCode}</TableCell>
                            <TableCell>{tx.description}</TableCell>
                            <TableCell className={`text-right font-mono font-semibold ${getAmountClass(tx)}`}>
                                {getAmount(tx)}
                            </TableCell>
                            <TableCell className="text-center">
                               <Badge variant={!tx.id ? 'outline' : 'default'} className="capitalize">
                                   {!tx.id ? 'Staged' : tx.status}
                               </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
