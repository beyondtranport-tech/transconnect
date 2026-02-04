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

const transactionSchema = z.object({
  transactionType: z.string().min(1, "Please select a transaction type."),
  paymentNo: z.string().optional(),
  effectiveDate: z.string().min(1, "Date is required."),
  interest: z.coerce.number().optional().default(0),
  capital: z.coerce.number().optional().default(0),
  reference: z.string().optional(),
  comment: z.string().optional(),
}).refine(data => data.interest !== 0 || data.capital !== 0, {
  message: "Either Interest or Capital must have a value.",
  path: ["capital"], // Assign error to a specific field
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

const transactionTypes = {
    'cash-credit': { label: 'Cash Credit (CR)', type: 'credit' },
    'deposit-payment': { label: 'Deposit payment (CR)', type: 'credit' },
    'internal-receipt': { label: 'Internal receipt (CR)', type: 'credit' },
    'journal-debit': { label: 'Journal debit (DR)', type: 'debit' },
    'journal-credit': { label: 'Journal credit (CR)', type: 'credit' },
    'paid-up': { label: 'Paid up (CR)', type: 'credit' },
    'settled': { label: 'Settled (CR)', type: 'credit' },
};

// Dummy data for demonstration
const dummyTransactions = [
  { id: 'txn-1', date: '2024-08-01', journal: 'Disbursement', reference: 'AG-101', detail: 'Initial loan payout', amount: 500000, balance: 500000 },
  { id: 'txn-2', date: '2024-09-01', journal: 'Payment', reference: 'EFT-CLIENT-001', detail: 'First installment', amount: -12000, balance: 488000 },
  { id: 'txn-3', date: '2024-10-01', journal: 'Payment', reference: 'EFT-CLIENT-002', detail: 'Second installment', amount: -12000, balance: 476000 },
];

const dummyClients = [
    { id: 'client-1', name: 'Sample Transport Co.' },
    { id: 'client-2', name: 'Another Client Ltd' },
];

const dummyAgreements: { [key: string]: { id: string; type: string }[] } = {
    'client-1': [{ id: 'AG-101', type: 'loan' }, { id: 'AG-102', type: 'lease' }],
    'client-2': [{ id: 'AG-205', type: 'factoring' }],
};


const formatCurrency = (amount: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);

function AddTransactionDialog({ client, agreement, onSave }: { client: any, agreement: any, onSave: (data: any) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    
    const form = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            effectiveDate: new Date().toISOString().split('T')[0],
        }
    });
    
    const { watch } = form;
    const selectedTransactionType = watch('transactionType');


    const onSubmit = async (values: TransactionFormValues) => {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const journalTypeInfo = transactionTypes[values.transactionType as keyof typeof transactionTypes];
        const amount = (values.capital || 0) + (values.interest || 0);

        const newTransaction = {
            id: `txn-${Date.now()}`,
            date: values.effectiveDate,
            journal: journalTypeInfo.label,
            reference: values.reference,
            detail: values.comment,
            amount: journalTypeInfo.type === 'debit' ? amount : -amount,
        };
        
        onSave(newTransaction);
        toast({ title: 'Journal Entry Posted', description: 'The transaction has been recorded.' });
        setIsLoading(false);
        setIsOpen(false);
        form.reset();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button disabled={!agreement}><PlusCircle className="mr-2 h-4 w-4"/> Add Transaction</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Add New Transaction</DialogTitle>
                    <DialogDescription>
                        Record a new transaction for agreement <span className="font-semibold">{agreement?.id}</span> for client <span className="font-semibold">{client?.name}</span>.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="transactionType" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Transaction Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {Object.entries(transactionTypes).map(([key, value]) => (
                                                <SelectItem key={key} value={key}>{value.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="paymentNo" render={({ field }) => (<FormItem><FormLabel>Payment No</FormLabel><FormControl><Input placeholder="Payment Number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <FormField control={form.control} name="effectiveDate" render={({ field }) => (<FormItem><FormLabel>Effective Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                             <FormField control={form.control} name="interest" render={({ field }) => (<FormItem><FormLabel>Interest</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>)} />
                             <FormField control={form.control} name="capital" render={({ field }) => (<FormItem><FormLabel>Capital</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <FormField control={form.control} name="reference" render={({ field }) => (<FormItem><FormLabel>Reference</FormLabel><FormControl><Input placeholder="e.g., Bank Statement Ref" {...field} /></FormControl><FormMessage /></FormItem>)} />
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

export default function TransactionsContent() {
    const [transactions, setTransactions] = useState(dummyTransactions);
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

    const displayClients = (clients && clients.length > 0) ? clients : dummyClients;

    const displayAgreements = useMemo(() => {
        if (!selectedClientId) return [];
        if (agreements && agreements.length > 0) return agreements;
        if (clients?.length === 0 || !clients) { // If no real clients, use dummy agreements
            return dummyAgreements[selectedClientId as keyof typeof dummyAgreements] || [];
        }
        return [];
    }, [agreements, clients, selectedClientId]);

    const selectedClient = useMemo(() => displayClients?.find(c => c.id === selectedClientId) || null, [displayClients, selectedClientId]);
    const selectedAgreement = useMemo(() => displayAgreements?.find((a: any) => a.id === selectedAgreementId) || null, [displayAgreements, selectedAgreementId]);
    
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
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DollarSign /> Transactions Ledger
                </CardTitle>
                <CardDescription>
                   Select a client and agreement to view the ledger or post new transactions.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="client-select">1. Select Client</Label>
                        <Select onValueChange={handleClientChange} disabled={areClientsLoading}>
                            <SelectTrigger id="client-select">
                                <SelectValue placeholder={areClientsLoading ? "Loading..." : "Select a client..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {displayClients.map(client => (
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
                                {displayAgreements.map((agreement: any) => (
                                    <SelectItem key={agreement.id} value={agreement.id}>{agreement.id}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <AddTransactionDialog client={selectedClient} agreement={selectedAgreement} onSave={handleSaveJournal} />
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
                                {transactions.map(tx => (
                                    <TableRow key={tx.id}>
                                        <TableCell>{tx.date}</TableCell>
                                        <TableCell className="font-medium capitalize">{tx.journal.replace('_', ' ')}</TableCell>
                                        <TableCell className="font-mono text-xs">{tx.reference}</TableCell>
                                        <TableCell>{tx.detail}</TableCell>
                                        <TableCell className={`text-right font-mono ${tx.amount > 0 ? 'text-destructive' : 'text-green-600'}`}>{formatCurrency(tx.amount)}</TableCell>
                                        <TableCell className="text-right font-mono font-semibold">{formatCurrency(tx.balance)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                 )}
            </CardContent>
        </Card>
    );
}
    