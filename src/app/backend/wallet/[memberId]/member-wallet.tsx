'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar as CalendarIcon, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { DocumentData, writeBatch, doc, collection, serverTimestamp, increment } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { Input } from '@/components/ui/input';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);

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
    const { user } = useUser();
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);


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
        if (!user || !firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const batch = writeBatch(firestore);

            const memberRef = doc(firestore, 'members', member.id);
            const transactionAmount = values.type === 'credit' ? values.amount : -values.amount;
            batch.update(memberRef, { walletBalance: increment(transactionAmount) });

            const transactionRef = doc(collection(firestore, 'transactions'));
            const newTransaction = {
                memberId: member.id,
                reconciliationId: 'manual-admin-entry',
                type: values.type,
                amount: values.amount,
                date: values.date,
                description: values.description,
                status: 'allocated',
                chartOfAccountsCode: '7000-ManualAdjustment',
                isAdjustment: true,
                postedAt: serverTimestamp(),
                postedBy: user.uid,
                transactionId: transactionRef.id
            };
            batch.set(transactionRef, newTransaction);
            
            await batch.commit();

            toast({ title: 'Success!', description: 'Transaction has been posted and wallet has been updated.' });
            form.reset();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Posting Failed',
                description: error.message || 'An unknown server error occurred.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

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
                    {isClient ? (
                        <p className="text-4xl font-bold">{formatCurrency(member.walletBalance || 0)}</p>
                    ) : (
                         <div className="h-12 w-48 bg-muted animate-pulse rounded-md mt-1" />
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
                    <CardDescription>A complete log of all wallet transactions for this member.</CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="text-center py-10 text-muted-foreground">
                     <p>Admin transaction history view is temporarily disabled.</p>
                   </div>
                </CardContent>
            </Card>
        </div>
    );
}
