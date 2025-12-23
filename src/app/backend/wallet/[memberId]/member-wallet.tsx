'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar as CalendarIcon, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { DocumentData, collection, query, where, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createManualTransaction } from '../../actions';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);

const formatDate = (timestamp: any) => {
    if (typeof timestamp === 'string') return timestamp;
    if (timestamp instanceof Date) return format(timestamp, "yyyy-MM-dd HH:mm");
    if (timestamp && timestamp.toDate) return format(timestamp.toDate(), "yyyy-MM-dd HH:mm");
    return 'N/A';
};

const transactionSchema = z.object({
  amount: z.coerce.number().positive('Amount must be a positive number'),
  description: z.string().min(1, 'Description is required'),
  date: z.date(),
  type: z.enum(['credit', 'debit']),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface MemberWalletProps {
    member: DocumentData;
}

export default function MemberWallet({ member }: MemberWalletProps) {
    const { toast } = useToast();
    const router = useRouter();
    const { user } = useUser();
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const transactionsQuery = useMemoFirebase(() => {
        if (!firestore || !member.id) return null;
        return query(
            collection(firestore, 'transactions'),
            where('memberId', '==', member.id),
            orderBy('date', 'desc')
        );
    }, [firestore, member.id]);

    const { data: transactions, isLoading: isLoadingTransactions, error } = useCollection(transactionsQuery);

    const form = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            amount: 0,
            description: '',
            date: new Date(),
            type: 'credit',
        },
    });


    const handleAddRecord = async (values: TransactionFormValues) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to perform this action.' });
            return;
        }

        setIsSubmitting(true);
        
        const result = await createManualTransaction({
            memberId: member.id,
            amount: values.amount,
            description: values.description,
            date: values.date,
            type: values.type,
            adminUserId: user.uid,
        });

        if (result.success) {
            toast({ title: 'Success!', description: 'Transaction has been posted and wallet has been updated.' });
            form.reset();
            // We don't need router.refresh() as useCollection will update the UI automatically.
        } else {
            toast({ variant: 'destructive', title: 'Posting Failed', description: result.error || "An unknown server error occurred." });
        }

        setIsSubmitting(false);
    };
    
    // Calculate cumulative balance
    const openingBalanceRecord = {
        id: 'opening-balance',
        date: new Date(member.createdAt.getTime() - 1000),
        description: 'Opening Balance',
        transactionId: 'N/A',
        type: 'credit',
        amount: 0,
        _sortDate: new Date(member.createdAt.getTime() - 1000), 
    };

    const allRecords = [
        openingBalanceRecord, 
        ...(transactions || []).map(tx => ({...tx, _sortDate: tx.date.toDate ? tx.date.toDate() : new Date(tx.date)}))
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
                    {isLoadingTransactions ? (
                         <div className="h-12 w-48 bg-muted animate-pulse rounded-md mt-1" />
                    ): (
                        <p className="text-4xl font-bold">{isClient ? formatCurrency(member.walletBalance || 0) : '...'}</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Add Manual Transaction</CardTitle>
                    <CardDescription>
                        Manually add a credit or debit to this member's wallet. This will create a transaction record and update their balance.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleAddRecord)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                 <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select transaction type" />
                                                </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="credit">Credit</SelectItem>
                                                    <SelectItem value="debit">Debit</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Amount (R)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                         <FormLabel>Transaction Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP")
                                                        ) : (
                                                            <span>Pick a date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date > new Date() || date < new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Manual correction for invoice #123" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                                Add Record
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>A complete log of all wallet transactions for this member, with a running balance.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingTransactions ? (
                         <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : error ? (
                        <div className="text-destructive text-center py-10">
                           <p>Could not load transactions.</p>
                           <p className="text-sm">{error.message}</p>
                        </div>
                    ) : (
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
                                        <TableCell>{isClient ? formatDate(tx.date) : '...'}</TableCell>
                                        <TableCell className="capitalize">{tx.description}</TableCell>
                                        <TableCell className="font-mono text-xs">{tx.transactionId}</TableCell>
                                        <TableCell className={`text-right font-mono ${tx.amount === 0 ? '' : tx.type === 'credit' ? 'text-green-600' : 'text-destructive'}`}>
                                            {isClient ? (tx.amount === 0 ? formatCurrency(0) : (tx.type === 'credit' ? `+${formatCurrency(tx.amount)}` : `-${formatCurrency(tx.amount)}`)) : '...'}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-semibold">{isClient ? formatCurrency(tx.runningBalance) : '...'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                     {transactions && transactions.length === 0 && !isLoadingTransactions && (
                        <p className="text-center text-muted-foreground py-10">No transactions found for this member.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
