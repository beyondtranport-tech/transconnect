
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { writeBatch, doc, collection, serverTimestamp, increment, Timestamp } from 'firebase/firestore';
import { Loader2, PlusCircle, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { DocumentData } from 'firebase/firestore';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form';
import { useRouter } from 'next/navigation';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const formatCurrency = (amount: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);

const formatDate = (timestamp: any) => {
    // Handle the special case for the string-based opening balance date
    if (typeof timestamp === 'string') {
        return timestamp;
    }
    if (timestamp && timestamp.toDate) {
        return format(timestamp.toDate(), "yyyy-MM-dd HH:mm");
    }
    return 'N/A';
};


const transactionSchema = z.object({
  date: z.date({
    required_error: "A date is required.",
  }),
  type: z.enum(['credit', 'debit']),
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  transactionId: z.string().min(1, 'A reference/ID is required'),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface MemberWalletProps {
    member: DocumentData;
    initialTransactions: DocumentData[];
}

export default function MemberWallet({ member, initialTransactions }: MemberWalletProps) {
    const { toast } = useToast();
    const router = useRouter();
    const { user: adminUser } = useUser();
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);
    
    const form = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionSchema),
        defaultValues: { type: 'credit', amount: 0, description: '', date: new Date(), transactionId: '' },
    });

    const handleAddRecord = async (values: TransactionFormValues) => {
        if (!adminUser || !firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Not authenticated or Firestore is unavailable.' });
            return;
        }

        setIsSubmitting(true);
        
        try {
            const batch = writeBatch(firestore);
            const transactionAmount = values.type === 'credit' ? values.amount : -values.amount;

            // 1. Update member's wallet balance
            const memberRef = doc(firestore, 'members', member.id);
            batch.set(memberRef, { walletBalance: increment(transactionAmount) }, { merge: true });

            // 2. Create the new transaction document
            const newTransactionRef = doc(collection(firestore, 'transactions'));
            const transactionData = {
                memberId: member.id,
                type: values.type,
                amount: values.amount,
                date: Timestamp.fromDate(values.date),
                description: values.description,
                status: 'allocated',
                chartOfAccountsCode: '7000-ManualAdjustment',
                isAdjustment: true,
                postedBy: adminUser.uid,
                transactionId: values.transactionId,
                createdAt: serverTimestamp()
            };
            batch.set(newTransactionRef, transactionData);

            await batch.commit();

            toast({ title: 'Success', description: 'Wallet has been updated and transaction recorded.' });
            form.reset({ type: 'credit', amount: 0, description: '', date: new Date(), transactionId: '' });
            router.refresh();

        } catch (error: any) {
            const permissionError = new FirestorePermissionError({
                path: `/members/${member.id}`,
                operation: 'write',
                requestResourceData: { amount: values.amount, description: values.description },
            });
            errorEmitter.emit('permission-error', permissionError);

            toast({ variant: 'destructive', title: 'Error', description: error.message || 'An unknown server error occurred.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate cumulative balance
    const openingBalanceRecord = {
        id: 'opening-balance',
        date: '2025-01-01 00:00', // Use a string to avoid timezone issues
        description: 'Opening Balance',
        transactionId: 'N/A',
        type: 'credit',
        amount: 0,
        // Helper for sorting
        _sortDate: new Date('2025-01-01T00:00:00Z'), 
    };

    // Add a consistent sorting key to all records
    const allRecords = [
        openingBalanceRecord, 
        ...initialTransactions.map(tx => ({...tx, _sortDate: tx.date.toDate()}))
    ];
    const sortedTransactions = allRecords.sort((a, b) => a._sortDate.getTime() - b._sortDate.getTime());

    let runningBalance = 0;
    const transactionsWithBalance = sortedTransactions.map(tx => {
        const amount = tx.amount === 0 ? 0 : (tx.type === 'credit' ? tx.amount : -tx.amount);
        runningBalance += amount;
        return { ...tx, runningBalance };
    }).reverse(); // Reverse back for descending chronological display

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
                    {isMounted ? (
                        <p className="text-4xl font-bold">{formatCurrency(member.walletBalance || 0)}</p>
                    ) : (
                        <p className="text-4xl font-bold">R 0.00</p> 
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Add New Transaction Record</CardTitle>
                    <CardDescription>
                        Manually add a credit or debit transaction to this member's wallet ledger.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleAddRecord)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                                
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
                                                        "w-full pl-3 text-left font-normal",
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
                               
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="credit">Credit (Add Funds)</SelectItem>
                                                    <SelectItem value="debit">Debit (Remove Funds)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                               
                                <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => <FormItem><FormLabel>Amount (ZAR)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>}
                                />
                                <div className="md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="e.g., Prize money, refund, etc." {...field} /></FormControl><FormMessage /></FormItem>}
                                />
                                </div>
                                
                                <FormField
                                    control={form.control}
                                    name="transactionId"
                                    render={({ field }) => <FormItem><FormLabel>Reference / ID</FormLabel><FormControl><Input placeholder="e.g., ADJ-001" {...field} /></FormControl><FormMessage /></FormItem>}
                                />
                                
                            </div>
                            <Button type="submit" disabled={isSubmitting} className="mt-4">
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
                    {isMounted ? (
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
                                        <TableCell>{formatDate(tx.date)}</TableCell>
                                        <TableCell className="capitalize">{tx.description}</TableCell>
                                        <TableCell className="font-mono text-xs">{tx.transactionId}</TableCell>
                                        <TableCell className={`text-right font-mono ${tx.amount === 0 ? '' : tx.type === 'credit' ? 'text-green-600' : 'text-destructive'}`}>
                                            {tx.amount === 0 ? formatCurrency(0) : (tx.type === 'credit' ? `+${formatCurrency(tx.amount)}` : `-${formatCurrency(tx.amount)}`)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-semibold">{formatCurrency(tx.runningBalance)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}
                     {initialTransactions.length === 0 && (
                        <p className="text-center text-muted-foreground py-10">No transactions found for this member.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
