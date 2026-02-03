'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote, PlusCircle, Loader2, Save } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const journalSchema = z.object({
  clientId: z.string().min(1, "Please select a client."),
  agreementId: z.string().min(1, "Please select an agreement."),
  journalType: z.enum(['payment', 'journal_credit', 'journal_debit', 'retention_refund', 'internal_payment']),
  reference: z.string().min(1, "Reference is required."),
  date: z.string().min(1, "Date is required."),
  amount: z.coerce.number().positive("Amount must be a positive number."),
});

type JournalFormValues = z.infer<typeof journalSchema>;

const journalTypes = {
    payment: 'Payment',
    journal_credit: 'Journal Credit',
    journal_debit: 'Journal Debit',
    retention_refund: 'Retention Refund',
    internal_payment: 'Internal Payment',
};

// Dummy data for the table
const dummyPayments = [
    { id: 'pay-1', date: '2024-07-28', clientName: 'Sample Transport Co.', agreementId: 'AG-101', type: 'Payment', amount: 50000, reference: 'EFT-123' },
    { id: 'pay-2', date: '2024-07-27', clientName: 'Another Client Ltd', agreementId: 'AG-205', type: 'Journal Debit', amount: 2500, reference: 'ADJ-001' },
];

function AddPaymentDialog({ onSave }: { onSave: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const firestore = useFirestore();

    const form = useForm<JournalFormValues>({
        resolver: zodResolver(journalSchema),
    });

    const selectedClientId = form.watch('clientId');

    const clientsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'lendingClients')) : null, [firestore]);
    const { data: clients, isLoading: areClientsLoading } = useCollection(clientsQuery);

    const agreementsQuery = useMemoFirebase(() => {
        if (!firestore || !selectedClientId) return null;
        return query(collection(firestore, `lendingClients/${selectedClientId}/agreements`));
    }, [firestore, selectedClientId]);
    const { data: agreements, isLoading: areAgreementsLoading } = useCollection(agreementsQuery);

    const onSubmit = async (values: JournalFormValues) => {
        setIsLoading(true);
        // Placeholder for API call to save the journal entry
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("Submitting Journal:", values);
        toast({ title: 'Journal Posted', description: 'The transaction has been recorded against the liability.' });
        setIsLoading(false);
        setIsOpen(false);
        onSave();
        form.reset();
    };
    
    return (
         <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4"/> Add Payment / Journal</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Create New Payment/Journal</DialogTitle>
                    <DialogDescription>
                        First select the client and agreement, then enter the transaction details.
                    </DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="clientId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Client</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={areClientsLoading}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select a client..." /></SelectTrigger></FormControl>
                                            <SelectContent>{(clients || []).map(client => (<SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>))}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="agreementId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Agreement</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedClientId || areAgreementsLoading}>
                                            <FormControl><SelectTrigger><SelectValue placeholder={areAgreementsLoading ? "Loading..." : "Select an agreement..."} /></SelectTrigger></FormControl>
                                            <SelectContent>{(agreements || []).map(agreement => (<SelectItem key={agreement.id} value={agreement.id}>{agreement.id}</SelectItem>))}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="journalType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Journal Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select journal type..." /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {Object.entries(journalTypes).map(([key, value]) => (
                                                <SelectItem key={key} value={key}>{value}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField control={form.control} name="reference" render={({ field }) => ( <FormItem><FormLabel>Journal Reference</FormLabel><FormControl><Input placeholder="e.g., EFT-12345 or INV-678" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="date" render={({ field }) => ( <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="amount" render={({ field }) => ( <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" placeholder="R 0.00" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />} Save Journal</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function PaymentsContent() {

    const handleSave = () => {
        // In a real app, this would trigger a re-fetch of the data table.
        console.log("Journal saved, refreshing data...");
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Banknote /> Payments Management
                    </CardTitle>
                    <CardDescription>
                       Record payments, credit/debit journals, and refunds against client liabilities.
                    </CardDescription>
                </div>
                <AddPaymentDialog onSave={handleSave} />
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Agreement</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dummyPayments.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell>{p.date}</TableCell>
                                    <TableCell>{p.clientName}</TableCell>
                                    <TableCell className="font-mono text-xs">{p.agreementId}</TableCell>
                                    <TableCell>{p.type}</TableCell>
                                    <TableCell className="font-mono text-xs">{p.reference}</TableCell>
                                    <TableCell className="text-right font-semibold">R {p.amount.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
