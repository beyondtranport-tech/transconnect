'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
    Loader2, Banknote, Scale, RefreshCcw, CheckCircle2, History, Building, Truck, 
    ArrowRight, UserCheck, AlertTriangle, Info, ShieldCheck, FileUp, Save, Landmark, Gavel, FileText
} from "lucide-react";
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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

/**
 * LENDING DISBURSEMENTS LEDGER (DMS)
 * Strategic oversight for closing liabilities created by active agreements.
 * Workflow: Agreement Activated -> Liability Created -> Settlement -> Asset Financed.
 */
export default function PaymentsContent() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    // 1. FETCH PENDING LIABILITIES - Manual Protocol
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

            // Execute the settlement via Admin API
            // This action will:
            // 1. Mark payment as 'completed'
            // 2. Find linked asset and mark as 'financed' (takes out of stock)
            // 3. Log the journal for the fiduciary ledger
            await fetchFromAdminAPI(token, 'executeLendingPayment', {
                paymentId: payment.id,
                assetId: payment.assetId,
                agreementId: payment.agreementId,
                method,
                notes: method === 'journal' ? 'Closing liability via accounting journal offset.' : 'Disbursement cleared via authorized bank EFT.'
            });

            toast({ title: method === 'journal' ? "Journal Node Posted" : "Bank Payment Recorded", description: "Asset moved to Financed standing." });
            forceLoad();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Settlement Failed", description: e.message });
        } finally {
            setIsProcessing(null);
        }
    };

    const columns: ColumnDef<any>[] = [
        {
            header: 'Agreement / Borrower',
            cell: ({row}) => (
                <div className="flex flex-col text-left">
                    <span className="font-bold text-foreground text-left">{row.original.clientName || 'Borrower'}</span>
                    <div className="flex items-center gap-1.5 mt-1 text-left">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[9px] text-muted-foreground font-mono uppercase">AGR: {row.original.agreementId?.slice(-6)}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Linked Asset Node',
            cell: ({row}) => (
                <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-700">{row.original.assetName}</span>
                    <div className="flex items-center gap-1.5 mt-1">
                        <Truck className="h-3 w-3 text-primary" />
                        <span className="text-[9px] text-muted-foreground font-mono uppercase">ID: {row.original.assetId?.slice(-6)}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Authorized Recipient',
            cell: ({row}) => (
                <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-foreground">{row.original.creditorName}</span>
                    <Badge variant="outline" className="w-fit text-[8px] h-3.5 mt-1 uppercase font-black border-primary/20 text-primary">
                        Registry Creditor
                    </Badge>
                </div>
            )
        },
        {
            header: 'Liability (ZAR)',
            cell: ({row}) => (
                <div className="flex flex-col text-right">
                    <span className="font-black text-primary text-sm">{formatCurrency(row.original.amount)}</span>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Settlement Value</span>
                </div>
            )
        },
        {
            header: 'Status',
            cell: ({row}) => (
                <Badge variant={row.original.status === 'completed' ? 'default' : 'secondary'} className={cn(
                    "capitalize text-[10px] font-black border-none",
                    row.original.status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                )}>
                    {row.original.status === 'pending' ? 'Pending Payout' : 'Concluded'}
                </Badge>
            )
        },
        {
            id: 'actions',
            header: <div className="text-right">Execution</div>,
            cell: ({ row }) => (
                <div className="flex justify-end gap-2 text-left">
                    {row.original.status === 'pending' ? (
                        <>
                            <Button size="sm" variant="outline" className="h-8 text-[9px] font-black uppercase tracking-widest gap-1.5 border-primary/30 text-primary" onClick={() => handleExecutePayment(row.original, 'journal')} disabled={!!isProcessing}>
                                <Scale className="h-3 w-3" /> Post Journal
                            </Button>
                            <Button size="sm" className="h-8 text-[9px] font-black uppercase tracking-widest gap-1.5 shadow-lg text-white" onClick={() => handleExecutePayment(row.original, 'bank')} disabled={!!isProcessing}>
                                <Landmark className="h-3 w-3" /> Bank Payment
                            </Button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2 text-green-600 text-[10px] font-black uppercase mr-2">
                            <ShieldCheck className="h-4 w-4" /> Settled via {row.original.settlementMethod}
                        </div>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 text-left text-foreground">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 text-left text-foreground">
                <div className="text-left text-foreground">
                    <h1 className="text-3xl font-black font-headline tracking-tight flex items-center gap-3 text-left">
                        <Banknote className="h-8 w-8 text-primary" />
                        Disbursements & Journals
                    </h1>
                    <p className="text-muted-foreground mt-1 text-left">Manage acquisition liabilities. Closing a node here finalizes asset ownership for the agreement.</p>
                </div>
                <Button variant="outline" size="sm" onClick={forceLoad} disabled={isLoading} className="gap-2 h-10 px-6 font-bold text-foreground">
                    <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} /> Refresh Ledger
                </Button>
            </div>

            <Card className="border-none shadow-xl bg-white overflow-hidden text-left text-foreground">
                <CardContent className="pt-6 text-left text-foreground">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center text-foreground">
                            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground text-center">Synchronizing Payment Registry...</p>
                        </div>
                    ) : (
                        <DataTable columns={columns} data={payments || []} />
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left text-foreground">
                <Card className="bg-primary/5 border-primary/20 p-8 rounded-[2.5rem] text-left text-foreground">
                    <CardHeader className="p-0 mb-4 text-left">
                        <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2 text-left text-foreground">
                            <Info className="h-5 w-5 text-primary" /> Accounting Logic
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-4 text-sm text-slate-600 leading-relaxed text-left text-foreground">
                        <p>Liability is recognized upon **Agreement Confirmation**. Executing a payment closes the creditor node and triggers the state transition of the asset from **Available (Stock)** to **Financed (Allocated)**.</p>
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-900 text-left text-foreground">
                            <CheckCircle2 className="h-4 w-4 text-primary" /> Ledger Balance Integrity Maintained
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 text-white border-none p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-left">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><History className="h-32 w-32 text-primary" /></div>
                    <CardHeader className="p-0 mb-4 text-left text-white">
                        <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2 text-white text-left">
                            <ShieldCheck className="h-5 w-5 text-primary" /> Forensic Release
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 text-xs text-slate-400 leading-relaxed text-left text-white">
                        Asset release is only authorized once the disbursement record reaches a 'Completed' status. The forensic trail links the bank reference or journal ID directly to the Agreement UID for high-velocity auditing.
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
