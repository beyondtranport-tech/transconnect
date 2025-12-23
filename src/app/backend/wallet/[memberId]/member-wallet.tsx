
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { writeBatch, doc, collection, serverTimestamp, increment } from 'firebase/firestore';
import { Loader2, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { DocumentData } from 'firebase/firestore';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
const formatDate = (timestamp: any) => timestamp && timestamp.toDate ? format(timestamp.toDate(), "yyyy-MM-dd HH:mm") : 'N/A';

const adjustmentSchema = z.object({
  type: z.enum(['credit', 'debit']),
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
});

type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;

interface MemberWalletProps {
    member: DocumentData;
    initialTransactions: DocumentData[];
}

export default function MemberWallet({ member, initialTransactions }: MemberWalletProps) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user: adminUser } = useUser();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);
    
    const form = useForm<AdjustmentFormValues>({
        resolver: zodResolver(adjustmentSchema),
        defaultValues: { type: 'credit', amount: 0, description: '' },
    });

    const handleAdjustment = async (values: AdjustmentFormValues) => {
        if (!firestore || !adminUser) {
            toast({ variant: 'destructive', title: 'Error', description: 'Not authenticated.' });
            return;
        }

        setIsSubmitting(true);
        
        const batch = writeBatch(firestore);
        const transactionAmount = values.type === 'credit' ? values.amount : -values.amount;

        // 1. Update member's wallet balance
        const memberRef = doc(firestore, 'members', member.id);
        batch.update(memberRef, { walletBalance: increment(transactionAmount) });

        // 2. Create a new transaction document
        const newTransactionRef = doc(collection(firestore, 'transactions'));
        batch.set(newTransactionRef, {
            memberId: member.id,
            type: values.type,
            amount: values.amount,
            date: serverTimestamp(),
            description: values.description,
            status: 'allocated',
            chartOfAccountsCode: '7000-ManualAdjustment',
            isAdjustment: true,
            postedBy: adminUser.uid,
            transactionId: `ADJ-${newTransactionRef.id.substring(0, 8).toUpperCase()}`
        });

        try {
            await batch.commit();
            toast({ title: 'Success', description: 'Wallet has been updated and transaction recorded.' });
            form.reset();
            // Note: The UI will update automatically thanks to the real-time listener on the parent page.
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
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
                    {isMounted ? (
                        <p className="text-4xl font-bold">{formatCurrency(member.walletBalance || 0)}</p>
                    ) : (
                        <p className="text-4xl font-bold">R 0.00</p> 
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Manual Wallet Adjustment</CardTitle>
                    <CardDescription>
                        Manually add a credit or debit to this member's wallet. This will create a corresponding transaction record.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(handleAdjustment)} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Select onValueChange={(value) => form.setValue('type', value as 'credit' | 'debit')} defaultValue="credit">
                                <SelectTrigger id="type">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="credit">Credit (Add Funds)</SelectItem>
                                    <SelectItem value="debit">Debit (Remove Funds)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (ZAR)</Label>
                            <Input id="amount" type="number" step="0.01" {...form.register('amount')} />
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="description">Description</Label>
                            <Input id="description" {...form.register('description')} placeholder="e.g., Prize money, refund, etc." />
                        </div>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                            Apply Adjustment
                        </Button>
                    </form>
                    {form.formState.errors.amount && <p className="text-destructive text-sm mt-2">{form.formState.errors.amount.message}</p>}
                    {form.formState.errors.description && <p className="text-destructive text-sm mt-2">{form.formState.errors.description.message}</p>}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>A complete log of all wallet transactions for this member.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Transaction ID</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialTransactions.map(tx => (
                                <TableRow key={tx.id}>
                                    <TableCell>{formatDate(tx.date)}</TableCell>
                                    <TableCell className="capitalize">{tx.description}</TableCell>
                                    <TableCell className="font-mono text-xs">{tx.transactionId}</TableCell>
                                    <TableCell className={`text-right font-mono ${tx.type === 'credit' ? 'text-green-600' : 'text-destructive'}`}>
                                        {tx.type === 'credit' ? `+${formatCurrency(tx.amount)}` : `-${formatCurrency(tx.amount)}`}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                     {initialTransactions.length === 0 && (
                        <p className="text-center text-muted-foreground py-10">No transactions found for this member.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
