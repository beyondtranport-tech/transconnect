'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Banknote, Scale, RefreshCcw, CheckCircle2, History, Building, Truck, ArrowRight, UserCheck, AlertTriangle } from "lucide-react";
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getClientSideAuthToken, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDateSafe, fetchFromAdminAPI } from '@/lib/utils';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

/**
 * LENDING DISBURSEMENTS LEDGER
 * Strategic oversight for closing liabilities created by agreements.
 * Paths: 1. Bank Payment (Standard) 2. Journal Entry (Surrender/Accounting)
 */
export default function PaymentsContent() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    // 1. FETCH PENDING LIABILITIES
    const paymentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'lendingPayments'), orderBy('createdAt', 'desc'), limit(100));
    }, [firestore]);
    const { data: payments, forceRefresh } = useCollection(paymentsQuery);

    const forceLoad = useCallback(async () => {
        setIsLoading(true);
        await forceRefresh();
        setIsLoading(false);
    }, [forceRefresh]);

    useEffect(() => { forceLoad(); }, [forceLoad]);

    const handleExecutePayment = async (payment: any, method: 'bank' | 'journal') => {
        setIsProcessing(payment.id);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed");

            await fetchFromAdminAPI(token, 'executeLendingPayment', {
                paymentId: payment.id,
                method,
                notes: method === 'journal' ? 'Closing liability via accounting journal.' : 'Disbursement cleared via bank EFT.'
            });

            toast({ title: method === 'journal' ? "Journal Entry Posted" : "Payment Recorded" });
            forceLoad();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Execution Failed", description: e.message });
        } finally {
            setIsProcessing(null);
        }
    };

    const columns: ColumnDef<any>[] = [
        {
            header: 'Fiduciary Context',
            cell: ({row}) => (
                <div className="flex flex-col text-left">
                    <span className="font-bold text-foreground">{row.original.clientName || 'Borrower'}</span>
                    <div className="flex items-center gap-1.5 mt-1">
                        <Truck className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground uppercase font-mono">{row.original.assetName}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Creditor (Recipient)',
            cell: ({row}) => (
                <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-700">{row.original.creditorName}</span>
                    <Badge variant="outline" className="w-fit text-[8px] h-3.5 mt-1 border-primary/20 text-primary uppercase font-black">
                        Authorized Dealer
                    </Badge>
                </div>
            )
        },
        {
            header: 'Liability Value',
            cell: ({row}) => (
                <div className="flex flex-col text-right">
                    <span className="font-black text-primary text-sm">{formatCurrency(row.original.amount)}</span>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Settlement Node</span>
                </div>
            )
        },
        {
            header: 'Status',
            cell: ({row}) => (
                <Badge variant={row.original.status === 'completed' ? 'default' : 'secondary'} className={cn(
                    "capitalize text-[10px] font-black",
                    row.original.status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                )}>
                    {row.original.status}
                </Badge>
            )
        },
        {
            id: 'actions',
            header: <div className="text-right">Settlement Path</div>,
            cell: ({ row }) => (
                <div className="flex justify-end gap-2 text-left">
                    {row.original.status === 'pending' ? (
                        <>
                            <Button size="sm" variant="outline" className="h-8 text-[9px] font-black uppercase tracking-widest gap-1.5 border-primary/30 text-primary" onClick={() => handleExecutePayment(row.original, 'journal')} disabled={!!isProcessing}>
                                <Scale className="h-3 w-3" /> Post Journal
                            </Button>
                            <Button size="sm" className="h-8 text-[9px] font-black uppercase tracking-widest gap-1.5 shadow-lg text-white" onClick={() => handleExecutePayment(row.original, 'bank')} disabled={!!isProcessing}>
                                <CheckCircle2 className="h-3 w-3" /> Bank Payment
                            </Button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2 text-green-600 text-[10px] font-bold uppercase mr-2">
                            <ShieldCheck className="h-4 w-4" /> Settled: {row.original.settlementMethod}
                        </div>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 text-left text-foreground">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 text-left">
                <div className="text-left">
                    <h1 className="text-3xl font-black font-headline tracking-tight flex items-center gap-3">
                        <Banknote className="h-8 w-8 text-primary" />
                        Disbursements & Journals
                    </h1>
                    <p className="text-muted-foreground mt-1">Oversight of capital flow to dealers and clients to close acquisition liabilities.</p>
                </div>
                <Button variant="outline" size="sm" onClick={forceLoad} disabled={isLoading} className="gap-2 h-10 px-6 font-bold">
                    <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} /> Refresh Ledger
                </Button>
            </div>

            <Card className="border-none shadow-xl bg-white text-left overflow-hidden">
                <CardContent className="pt-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Syncing Payment Nodes...</p>
                        </div>
                    ) : (
                        <DataTable columns={columns} data={payments || []} />
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <Card className="bg-primary/5 border-primary/20 p-8 rounded-[2.5rem] text-left">
                    <CardHeader className="p-0 mb-4 text-left">
                        <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                            <Info className="h-5 w-5 text-primary" /> Accounting Logic
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-4 text-sm text-slate-600 leading-relaxed text-left">
                        <p>Liability is created upon Agreement Protocol commitment. Executing a payment or journal entry closes the creditor record and marks the asset as <strong>Authorized for Release</strong>.</p>
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-900 text-left">
                            <CheckCircle2 className="h-4 w-4 text-primary" /> Ledger Balance Reconciliation
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 text-white border-none p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-left">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><History className="h-32 w-32 text-primary" /></div>
                    <CardHeader className="p-0 mb-4 text-left">
                        <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2 text-white text-left">
                            <ShieldCheck className="h-5 w-5 text-primary" /> Fiduciary integrity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 text-xs text-slate-400 leading-relaxed text-left">
                        All payments are hard-coded to their originating agreement ID and asset VIN. This ensures an immutable forensic trail for institutional audits.
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
