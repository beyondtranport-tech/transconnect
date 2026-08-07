'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PlusCircle, Receipt, ArrowUpRight, ArrowDownLeft, FileText, Scale, RefreshCw } from "lucide-react";
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getClientSideAuthToken } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDateSafe } from '@/lib/utils';

// Helper for API calls
async function performAdminAction(token: string, action: string, payload: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error for action: ${action}`);
    }
    return result;
}

const typeBadges: { [key: string]: { label: string, variant: 'default' | 'secondary' | 'destructive' | 'outline' } } = {
    raised_installment: { label: 'Raised Installment', variant: 'destructive' },
    receipt: { label: 'Receipt', variant: 'default' },
    journal_credit: { label: 'Journal Credit', variant: 'secondary' },
    journal_debit: { label: 'Journal Debit', variant: 'outline' },
};

export default function TransactionsContent() {
    const [agreements, setAgreements] = useState<any[]>([]);
    const [selectedAgreementId, setSelectedAgreementId] = useState<string>('');
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPosting, setIsPosting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { toast } = useToast();

    // Form state for posting manual journal entries
    const [txnType, setTxnType] = useState<'receipt' | 'journal_credit' | 'journal_debit'>('receipt');
    const [amount, setAmount] = useState<number>(0);
    const [reference, setReference] = useState<string>('');
    const [notes, setNotes] = useState<string>('');

    // Fetch live agreements list
    const fetchAgreements = useCallback(async () => {
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            const res = await performAdminAction(token, 'getLendingData', { collectionName: 'agreements' });
            const liveAgreements = (res.data || []).filter((a: any) => a.status === 'active');
            setAgreements(liveAgreements);
            if (liveAgreements.length > 0 && !selectedAgreementId) {
                setSelectedAgreementId(liveAgreements[0].id);
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error loading agreements', description: e.message });
        }
    }, [selectedAgreementId, toast]);

    // Fetch transactions for selected agreement
    const fetchTransactions = useCallback(async () => {
        if (!selectedAgreementId) return;
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            const res = await performAdminAction(token, 'getLendingTransactions', { agreementId: selectedAgreementId });
            setTransactions(res.data || []);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error loading ledger', description: e.message });
        } finally {
            setIsLoading(false);
        }
    }, [selectedAgreementId, toast]);

    useEffect(() => {
        fetchAgreements();
    }, [fetchAgreements]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const activeAgreement = useMemo(() => {
        return agreements.find(a => a.id === selectedAgreementId);
    }, [agreements, selectedAgreementId]);

    // Financial Metrics Calculations based on ledger movements
    const metrics = useMemo(() => {
        let totalRaised = 0;
        let totalReceipts = 0;
        let totalCredits = 0;
        let totalDebits = 0;

        transactions.forEach(t => {
            const val = Number(t.amount || 0);
            if (t.type === 'raised_installment') totalRaised += val;
            if (t.type === 'receipt') totalReceipts += val;
            if (t.type === 'journal_credit') totalCredits += val;
            if (t.type === 'journal_debit') totalDebits += val;
        });

        const nowDue = (totalRaised + totalDebits) - (totalReceipts + totalCredits);
        const principal = Number(activeAgreement?.totalAdvanced || 0) + Number(activeAgreement?.charges || 0);
        const capitalOutstanding = Math.max(0, principal - totalReceipts);
        const balanceOutstanding = Math.max(0, Number(activeAgreement?.totalPayable || principal) - totalReceipts);

        return {
            nowDue,
            capitalOutstanding,
            balanceOutstanding,
            totalReceipts
        };
    }, [transactions, activeAgreement]);

    // Post manual ledger entry / journal
    const handlePostJournal = async () => {
        if (!amount || amount <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Enter a valid amount.' });
            return;
        }
        setIsPosting(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed");

            await performAdminAction(token, 'postLendingTransaction', {
                transaction: {
                    agreementId: selectedAgreementId,
                    type: txnType,
                    amount: Number(amount),
                    reference,
                    notes,
                    date: new Date().toISOString()
                }
            });

            toast({ title: 'Transaction Posted', description: 'Ledger synchronized.' });
            setIsDialogOpen(false);
            setAmount(0);
            setReference('');
            setNotes('');
            fetchTransactions();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Posting Failed', description: e.message });
        } finally {
            setIsPosting(false);
        }
    };

    const columns: ColumnDef<any>[] = [
        { accessorKey: 'date', header: 'Date', cell: ({ row }) => formatDateSafe(row.original.date) },
        { accessorKey: 'type', header: 'Type', cell: ({ row }) => {
            const badge = typeBadges[row.original.type] || { label: row.original.type, variant: 'outline' };
            return <Badge variant={badge.variant}>{badge.label}</Badge>;
        }},
        { accessorKey: 'reference', header: 'Reference' },
        { accessorKey: 'amount', header: 'Amount (ZAR)', cell: ({ row }) => {
            const isDebit = row.original.type === 'raised_installment' || row.original.type === 'journal_debit';
            return (
                <span className={isDebit ? "text-amber-600 font-bold" : "text-green-600 font-bold"}>
                    {isDebit ? '+' : '-'}{formatCurrency(row.original.amount)}
                </span>
            );
        }},
        { accessorKey: 'notes', header: 'Notes' },
    ];

    return (
        <div className="space-y-6 text-left">
            {/* Top Selector Bar */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div>
                        <CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5 text-primary" /> Transactions Ledger</CardTitle>
                        <CardDescription>Select an agreement to inspect live balances and post journal entries.</CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                        <Select value={selectedAgreementId} onValueChange={setSelectedAgreementId}>
                            <SelectTrigger className="w-[300px] bg-white border-2 font-bold">
                                <SelectValue placeholder="Select active agreement..." />
                            </SelectTrigger>
                            <SelectContent>
                                {agreements.map(a => (
                                    <SelectItem key={a.id} value={a.id}>{a.description} ({formatCurrency(a.totalAdvanced)})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button disabled={!selectedAgreementId}><PlusCircle className="mr-2 h-4 w-4" /> Post Journal / Receipt</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Post Manual Transaction</DialogTitle>
                                    <DialogDescription>Adjust transaction ledger with a receipt or journal debit/credit.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label>Transaction Type</Label>
                                        <Select value={txnType} onValueChange={(v: any) => setTxnType(v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="receipt">Receipt (Payment Received)</SelectItem>
                                                <SelectItem value="journal_credit">Journal Credit (Credit Note)</SelectItem>
                                                <SelectItem value="journal_debit">Journal Debit (Fee / Charge)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Amount (ZAR)</Label>
                                        <Input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} placeholder="0.00" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Reference Number</Label>
                                        <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. REC-99201" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Notes / Reason</Label>
                                        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Provide commercial context..." />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handlePostJournal} disabled={isPosting}>
                                        {isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Post Transaction
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>

                {/* Financial Summary Banner */}
                {selectedAgreementId && (
                    <CardContent className="border-t bg-slate-50/50 pt-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div className="p-4 bg-white rounded-xl border">
                                <p className="text-[10px] font-black uppercase text-muted-foreground">Now Due</p>
                                <p className="text-xl font-black text-amber-600 mt-1">{formatCurrency(metrics.nowDue)}</p>
                            </div>
                            <div className="p-4 bg-white rounded-xl border">
                                <p className="text-[10px] font-black uppercase text-muted-foreground">Capital Outstanding</p>
                                <p className="text-xl font-black text-slate-900 mt-1">{formatCurrency(metrics.capitalOutstanding)}</p>
                            </div>
                            <div className="p-4 bg-white rounded-xl border">
                                <p className="text-[10px] font-black uppercase text-muted-foreground">Balance Outstanding</p>
                                <p className="text-xl font-black text-slate-900 mt-1">{formatCurrency(metrics.balanceOutstanding)}</p>
                            </div>
                            <div className="p-4 bg-white rounded-xl border">
                                <p className="text-[10px] font-black uppercase text-muted-foreground">Total Receipts</p>
                                <p className="text-xl font-black text-green-600 mt-1">{formatCurrency(metrics.totalReceipts)}</p>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Transactions Ledger Data Table */}
            <Card>
                <CardContent className="pt-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : (
                        <DataTable columns={columns} data={transactions} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}