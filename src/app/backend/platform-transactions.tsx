
'use client';

import { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Banknote, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const transactionSchema = z.object({
  date: z.string().min(1, "Date is required."),
  description: z.string().min(1, "Description is required."),
  chartOfAccountsCode: z.string().min(1, "Account code is required."),
  amount: z.coerce.number().positive("Amount must be a positive number."),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

const chartOfAccounts = {
    expenses: [
        { code: '7010', name: 'Bank Charges' },
        { code: '7020', name: 'Software & Subscriptions' },
        { code: '7030', name: 'Consulting & Professional Fees' },
        { code: '7040', name: 'Marketing & Advertising' },
        { code: '7050', name: 'General & Administrative' },
        { code: '8010', name: 'Wallet Adjustment (Manual)' },
        { code: '8020', name: 'Transaction Reversal' },
    ]
};

const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
};

const formatDate = (date: Date | string) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'Invalid Date';
    return format(d, 'yyyy-MM-dd');
};

const formatDisplayDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
     if (isNaN(d.getTime())) return 'Invalid Date';
    return format(d, 'dd MMM yyyy');
}


function AddTransactionForm({ onTransactionAdded }: { onTransactionAdded: () => void }) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const firestore = useFirestore();
    const { user } = useUser();

    const form = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            date: formatDate(new Date()),
            description: '',
            chartOfAccountsCode: '',
            amount: '' as any,
        },
    });

    const onSubmit = async (values: TransactionFormValues) => {
        setIsLoading(true);
        if (!firestore || !user) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not available or not authenticated.' });
            setIsLoading(false);
            return;
        }
        
        try {
            const collectionRef = collection(firestore, 'platformTransactions');
            const data = {
                ...values,
                type: 'debit', // All platform transactions are debits from business account
                date: new Date(values.date),
                postedBy: user.uid,
                postedAt: serverTimestamp(),
                status: 'allocated'
            };
            await addDoc(collectionRef, data);

            toast({ title: 'Transaction Added', description: 'The platform expense has been recorded.' });
            form.reset({ date: formatDate(new Date()), description: '', chartOfAccountsCode: '', amount: '' as any });
            onTransactionAdded();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-1">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" {...form.register('date')} />
                {form.formState.errors.date && <p className="text-xs text-destructive">{form.formState.errors.date.message}</p>}
            </div>
            <div className="space-y-1 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" {...form.register('description')} placeholder="e.g., Monthly Software Subscription"/>
                {form.formState.errors.description && <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>}
            </div>
            <div className="space-y-1">
                <Label htmlFor="chartOfAccountsCode">Account</Label>
                 <Select onValueChange={(value) => form.setValue('chartOfAccountsCode', value)} value={form.watch('chartOfAccountsCode')}>
                    <SelectTrigger><SelectValue placeholder="Select account..." /></SelectTrigger>
                    <SelectContent>
                        {chartOfAccounts.expenses.map(acc => (
                            <SelectItem key={acc.code} value={acc.code}>{acc.code} - {acc.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 {form.formState.errors.chartOfAccountsCode && <p className="text-xs text-destructive">{form.formState.errors.chartOfAccountsCode.message}</p>}
            </div>
            <div className="space-y-1">
                <Label htmlFor="amount">Amount (R)</Label>
                <Input id="amount" type="number" {...form.register('amount')} placeholder="150.00" />
                {form.formState.errors.amount && <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>}
            </div>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
            </Button>
        </form>
    );
}


export default function PlatformTransactions() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const transactionsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'platformTransactions'), orderBy('date', 'desc'));
    }, [firestore]);

    const { data: transactions, isLoading, forceRefresh } = useCollection(transactionsQuery);

    const handleDelete = async (id: string) => {
        if (!firestore) return;
        try {
            await deleteDoc(doc(firestore, 'platformTransactions', id));
            toast({ title: "Transaction Deleted" });
            forceRefresh();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Delete Failed", description: e.message });
        }
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Banknote /> Platform Ledger</CardTitle>
                    <CardDescription>
                       Record and manage transactions for the Business Operating Account, such as platform expenses or payments to external creditors.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <AddTransactionForm onTransactionAdded={forceRefresh} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Platform Transactions</CardTitle>
                </CardHeader>
                 <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : transactions && transactions.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Account Code</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map(tx => (
                                    <TableRow key={tx.id}>
                                        <TableCell>{formatDisplayDate(tx.date)}</TableCell>
                                        <TableCell>{tx.description}</TableCell>
                                        <TableCell className="font-mono">{tx.chartOfAccountsCode}</TableCell>
                                        <TableCell className="text-right font-mono font-semibold text-destructive">
                                            - {formatCurrency(tx.amount)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(tx.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                         <div className="text-center py-10 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">No platform transactions recorded yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
