'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, PlusCircle, Loader2, Save } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

const journalSchema = z.object({
  date: z.string().min(1, "Date is required."),
  journalType: z.string().min(1, "Journal type is required."),
  reference: z.string().min(1, "Reference is required."),
  detail: z.string().min(1, "Detail is required."),
  amount: z.coerce.number(),
});

type JournalFormValues = z.infer<typeof journalSchema>;

// Dummy data for demonstration
const dummyTransactions = [
  { id: 'txn-1', date: '2024-08-01', journal: 'Disbursement', reference: 'AG-101', detail: 'Initial loan payout', amount: -500000, balance: -500000 },
  { id: 'txn-2', date: '2024-09-01', journal: 'Payment', reference: 'EFT-CLIENT-001', detail: 'First installment', amount: 12000, balance: -488000 },
  { id: 'txn-3', date: '2024-10-01', journal: 'Payment', reference: 'EFT-CLIENT-002', detail: 'Second installment', amount: 12000, balance: -476000 },
];

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);

function AddJournalDialog({ onSave }: { onSave: (data: JournalFormValues) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    
    const form = useForm<JournalFormValues>({
        resolver: zodResolver(journalSchema),
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
        }
    });

    const onSubmit = async (values: JournalFormValues) => {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("Submitting Journal:", values);
        onSave(values);
        toast({ title: 'Journal Entry Posted', description: 'The transaction has been recorded.' });
        setIsLoading(false);
        setIsOpen(false);
        form.reset();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4"/> Add Journal Entry</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Journal Entry</DialogTitle>
                    <DialogDescription>
                        Record a new transaction against a liability based on bank statement records.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField control={form.control} name="date" render={({ field }) => (<FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="journalType" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Journal Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="payment">Payment</SelectItem>
                                        <SelectItem value="journal_debit">Journal Debit</SelectItem>
                                        <SelectItem value="journal_credit">Journal Credit</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="reference" render={({ field }) => (<FormItem><FormLabel>Reference</FormLabel><FormControl><Input placeholder="e.g., Bank Statement Ref" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="detail" render={({ field }) => (<FormItem><FormLabel>Detail</FormLabel><FormControl><Input placeholder="e.g., Monthly Installment" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" placeholder="Use negative for debits" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <DialogFooter>
                            <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>} Post Journal</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function TransactionsContent() {
    const [transactions, setTransactions] = useState(dummyTransactions);

    const handleSaveJournal = (data: JournalFormValues) => {
        const newTransaction = {
            id: `txn-${Date.now()}`,
            date: data.date,
            journal: data.journalType,
            reference: data.reference,
            detail: data.detail,
            amount: data.amount,
            balance: (transactions[transactions.length - 1]?.balance || 0) + data.amount,
        };
        setTransactions(prev => [...prev, newTransaction]);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign /> Transactions Ledger
                    </CardTitle>
                    <CardDescription>
                        A ledger reflecting journals raised by users based on bank statement records.
                    </CardDescription>
                </div>
                <AddJournalDialog onSave={handleSaveJournal} />
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px]">Date</TableHead>
                                <TableHead>Journal</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead>Detail</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Cumulative Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map(tx => (
                                <TableRow key={tx.id}>
                                    <TableCell>{tx.date}</TableCell>
                                    <TableCell className="font-medium capitalize">{tx.journal.replace('_', ' ')}</TableCell>
                                    <TableCell className="font-mono text-xs">{tx.reference}</TableCell>
                                    <TableCell>{tx.detail}</TableCell>
                                    <TableCell className={`text-right font-mono ${tx.amount > 0 ? 'text-green-600' : 'text-destructive'}`}>{formatCurrency(tx.amount)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(tx.balance)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
