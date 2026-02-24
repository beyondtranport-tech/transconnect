
'use client';

import { useState, useMemo } from 'react';
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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Label } from '@/components/ui/label';
import { Textarea } from "@/components/ui/textarea";

const journalSchema = z.object({
  clientId: z.string().min(1, "Please select a client."),
  agreementId: z.string().min(1, "Please select an agreement."),
  journalType: z.enum(['payment', 'journal_credit', 'journal_debit', 'retention_refund', 'internal_payment']),
  reference: z.string().min(1, "Reference is required."),
  date: z.string().min(1, "Date is required."),
  amount: z.coerce.number().positive("Amount must be a positive number."),
  comment: z.string().optional(),
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

const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number' || isNaN(amount)) return 'R 0.00';
    const parts = amount.toFixed(2).toString().split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `R ${integerPart}.${parts[1]}`;
};


function AddPaymentDialog({ client, agreement, onSave }: { client: any, agreement: any, onSave: (data: any) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    
    const form = useForm<JournalFormValues>({
        resolver: zodResolver(journalSchema),
        defaultValues: {
            journalType: 'payment',
            reference: '',
            date: new Date().toISOString().split('T')[0],
            amount: 0,
            comment: '',
        }
    });
    
    const { watch } = form;


    const onSubmit = async (values: JournalFormValues) => {
        setIsLoading(true);
        // Placeholder for API call to save the journal entry
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
                <Button disabled={!agreement}><PlusCircle className="mr-2 h-4 w-4"/> Add Payment / Journal</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Create New Payment/Journal</DialogTitle>
                    <DialogDescription>
                        Record a new transaction for agreement <span className="font-semibold">{agreement?.id}</span> for client <span className="font-semibold">{client?.name}</span>.
                    </DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormItem>
                                <FormLabel>Client</FormLabel>
                                <Input value={client?.name || ''} disabled />
                            </FormItem>
                            <FormItem>
                                <FormLabel>Agreement</FormLabel>
                                <Input value={agreement?.id || ''} disabled />
                            </FormItem>
                        </div>
                        <FormField
                            control={form.control}
                            name="journalType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Journal Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl>
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
                        <FormField control={form.control} name="comment" render={({ field }) => (<FormItem><FormLabel>Comment</FormLabel><FormControl><Textarea placeholder="e.g., Monthly Installment" {...field} /></FormControl><FormMessage /></FormItem>)} />

                        <DialogFooter>
                            <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>} Post Journal</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function PaymentsContent() {
    const [transactions, setTransactions] = useState<any[]>(dummyPayments);
    const firestore = useFirestore();
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);

    const clientsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'lendingClients')) : null, [firestore]);
    const { data: clients, isLoading: areClientsLoading } = useCollection(clientsQuery);
    
    const agreementsQuery = useMemoFirebase(() => {
        if (!firestore || !selectedClientId) return null;
        return query(collection(firestore, `lendingClients/${selectedClientId}/agreements`));
    }, [firestore, selectedClientId]);
    const { data: agreements, isLoading: areAgreementsLoading } = useCollection(agreementsQuery);

    const selectedClient = useMemo(() => clients?.find((c: any) => c.id === selectedClientId) || null, [clients, selectedClientId]);
    const selectedAgreement = useMemo(() => agreements?.find((a: any) => a.id === selectedAgreementId) || null, [agreements, selectedAgreementId]);
    
    const handleClientChange = (clientId: string) => {
        setSelectedClientId(clientId);
        setSelectedAgreementId(null); 
    };

    const handleAgreementChange = (agreementId: string) => {
        setSelectedAgreementId(agreementId);
    };

    const handleSaveJournal = (data: any) => {
        const latestBalance = transactions.length > 0 ? transactions[transactions.length - 1].balance : 0;
        const newTransaction = {
            ...data,
            balance: latestBalance + data.amount,
        };
        setTransactions(prev => [...prev, newTransaction].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    };

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
                <AddTransactionDialog client={selectedClient} agreement={selectedAgreement} onSave={handleSaveJournal} />
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="client-select">1. Select Client</Label>
                        <Select onValueChange={handleClientChange} disabled={areClientsLoading} value={selectedClientId || ''}>
                            <SelectTrigger id="client-select">
                                <SelectValue placeholder={areClientsLoading ? "Loading..." : "Select a client..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {(clients || []).map((client: any) => (
                                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="agreement-select">2. Select Agreement</Label>
                         <Select onValueChange={handleAgreementChange} disabled={!selectedClient || areAgreementsLoading} value={selectedAgreementId || ''}>
                            <SelectTrigger id="agreement-select">
                                <SelectValue placeholder={areAgreementsLoading ? "Loading..." : "Select an agreement..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {(agreements || []).map((agreement: any) => (
                                    <SelectItem key={agreement.id} value={agreement.id}>{agreement.id}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 {selectedAgreement && (
                    <div className="border rounded-lg mt-6">
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
                                {transactions.length > 0 ? transactions.map(tx => (
                                    <TableRow key={tx.id}>
                                        <TableCell>{tx.date}</TableCell>
                                        <TableCell className="font-medium capitalize">{tx.type.replace('_', ' ')}</TableCell>
                                        <TableCell className="font-mono text-xs">{tx.reference}</TableCell>
                                        <TableCell>{tx.detail}</TableCell>
                                        <TableCell className={`text-right font-mono ${tx.amount > 0 ? 'text-green-600' : 'text-destructive'}`}>{formatCurrency(tx.amount)}</TableCell>
                                        <TableCell className="text-right font-mono font-semibold">{formatCurrency(tx.balance)}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                            No transactions for this agreement yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                 )}
            </CardContent>
        </Card>
    );
}
