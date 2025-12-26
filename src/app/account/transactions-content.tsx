
'use client';

import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, DollarSign, ClipboardCopy, FilePlus } from 'lucide-react';
import { collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import bankDetailsData from '@/lib/bank-details.json';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
};

const formatDate = (timestamp: any) => {
    if (timestamp && timestamp.toDate) {
        return format(timestamp.toDate(), "dd MMM yyyy, HH:mm");
    }
    return 'N/A';
};

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  pending_allocation: 'secondary',
  allocated: 'default',
  reversal: 'destructive',
};

const paymentFormSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive.'),
  description: z.string().min(1, 'Please select a payment reason.'),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

function LogPaymentDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const form = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentFormSchema),
        defaultValues: { amount: 0, description: '' },
    });

    const onSubmit = async (values: PaymentFormValues) => {
        if (!user || !firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
            return;
        }
        setIsLoading(true);

        const transactionData = {
            type: 'credit',
            amount: values.amount,
            description: values.description,
            date: serverTimestamp(),
            status: 'pending_allocation',
            isAdjustment: true, // Marked as adjustment since it's a user-logged payment
        };
        
        try {
            const transactionsCollectionRef = collection(firestore, `members/${user.uid}/transactions`);
            
            // This is a non-blocking write. We add the document and handle errors in the catch block.
            addDoc(transactionsCollectionRef, transactionData)
              .then(docRef => {
                // You can perform non-essential follow-up actions here, like updating the doc with its own ID
                console.log("Payment logged with ID: ", docRef.id);
              })
              .catch(serverError => {
                const permissionError = new FirestorePermissionError({
                  path: `members/${user.uid}/transactions`,
                  operation: 'create',
                  requestResourceData: transactionData,
                });
                errorEmitter.emit('permission-error', permissionError);
              });

            toast({
                title: 'Payment Logged',
                description: 'Your payment record has been created and is pending admin approval.',
            });
            setIsOpen(false);
            form.reset();
        } catch (error: any) {
            // This catch block is for synchronous errors during form validation or setup
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <FilePlus className="mr-2 h-4 w-4" /> Add Transaction
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Log a New EFT Payment</DialogTitle>
                    <DialogDescription>
                        Fill in the details of the payment you made. This will create a pending record for the admin to approve.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField control={form.control} name="amount" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Amount (ZAR)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="500.00" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reason for Payment</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a payment reason" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Membership fee">Membership fee</SelectItem>
                                  <SelectItem value="Funding (DMS) payment">Funding (DMS) payment</SelectItem>
                                  <SelectItem value="Mall purchase">Mall purchase</SelectItem>
                                  <SelectItem value="Marketplace purchase">Marketplace purchase</SelectItem>
                                  <SelectItem value="Tech purchase">Tech purchase</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                             <Button type="submit" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Save Record'}
                             </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function TransactionsContent() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const bankDetails = bankDetailsData || {};

    const transactionsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'members', user.uid, 'transactions'), orderBy('date', 'desc'));
    }, [firestore, user]);
    
    const { data: transactions, isLoading: isTransactionsLoading, error } = useCollection(transactionsQuery);

    const isLoading = isUserLoading || isTransactionsLoading;
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({ title: "Copied!", description: `Your reference has been copied to the clipboard.`});
        });
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Top up your Wallet via EFT</CardTitle>
                    <CardDescription>
                        To add funds, make an EFT payment using the details below. Then, log your payment using the button in the history section below.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Object.entries(bankDetails).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <span className="font-mono">{value}</span>
                            </div>
                        ))}
                        {user && (
                            <div className="flex justify-between items-center text-sm pt-3 border-t">
                                <span className="text-muted-foreground font-semibold">Your Payment Reference (Required)</span>
                                <button onClick={() => copyToClipboard(user.uid)} className="font-mono text-primary hover:underline flex items-center gap-2">
                                    {user.uid}
                                    <ClipboardCopy className="h-4 w-4"/>
                                </button>
                            </div>
                        )}
                    </div>
                </CardContent>
                 <CardFooter>
                    <p className="text-xs text-muted-foreground">Your balance is updated by an admin after payment is confirmed.</p>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                           <DollarSign className="h-6 w-6" />
                           Transaction History
                        </CardTitle>
                        <CardDescription>A complete record of your wallet transactions and pending payments.</CardDescription>
                    </div>
                     <LogPaymentDialog />
                </CardHeader>
                <CardContent>
                    {isLoading && (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}
                    
                    {error && (
                        <div className="text-center py-10 text-destructive">
                            <p>Error loading transactions: {error.message}</p>
                        </div>
                    )}
                    
                    {!isLoading && transactions && (
                         transactions.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell className="text-muted-foreground text-xs">{formatDate(tx.date)}</TableCell>
                                            <TableCell>
                                                <p className="font-medium">{tx.description}</p>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusColors[tx.status] || 'secondary'} className="capitalize">
                                                    {tx.status.replace(/_/g, ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={`text-right font-mono font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-destructive'}`}>
                                                {tx.type === 'credit' ? '+' : '-'} {formatCurrency(tx.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                         ) : (
                            <div className="text-center py-20">
                              <p className="text-muted-foreground">You have no transactions yet.</p>
                              <p className="text-sm text-muted-foreground">Log an EFT payment to get started.</p>
                            </div>
                         )
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
