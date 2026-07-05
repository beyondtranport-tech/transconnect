
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Truck, Handshake, ShieldCheck, Search, FileText, CheckCircle, XCircle, ArrowRight, RefreshCcw, DollarSign, Database, Gavel, Scale } from 'lucide-react';
import { getClientSideAuthToken } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDateSafe, cn } from '@/lib/utils';
import Link from 'next/link';

async function performAdminAction(token: string, action: string, payload?: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
        cache: 'no-store'
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || `API Error: ${action}`);
    return result;
}

export default function BuySellOversight() {
    const [sales, setSales] = useState<any[]>([]);
    const [inventory, setInventory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
    const { toast } = useToast();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;

            const [salesRes, inventoryRes] = await Promise.all([
                performAdminAction(token, 'getGlobalSales'),
                performAdminAction(token, 'searchListings', { term: '' })
            ]);

            setSales(salesRes.data || []);
            setInventory(inventoryRes.data || []);
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Load Failed", description: e.message });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleFinalize = async (sale: any) => {
        setIsActionLoading(sale.id);
        try {
            const token = await getClientSideAuthToken();
            await performAdminAction(token, 'finalizeSale', { saleId: sale.id });
            toast({ title: "Sale Concluded", description: "Funds disbursed and commission isolated." });
            loadData();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Finalization Failed", description: e.message });
        } finally {
            setIsActionLoading(null);
        }
    };

    const saleColumns: ColumnDef<any>[] = [
        { 
            header: 'Transaction / Asset',
            cell: ({row}) => (
                <div className="flex flex-col text-left">
                    <span className="font-bold text-foreground">{row.original.vehicleName}</span>
                    <span className="text-[10px] text-muted-foreground font-mono uppercase">{row.original.id}</span>
                </div>
            )
        },
        { 
            header: 'Buyer vs Seller',
            cell: ({row}) => (
                <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-blue-600">B: {row.original.buyerName}</span>
                    <span className="text-xs font-bold text-slate-600">S: {row.original.sellerName}</span>
                </div>
            )
        },
        { 
            header: 'Value / Yield',
            cell: ({row}) => (
                <div className="flex flex-col text-left">
                    <span className="font-black text-foreground">{formatCurrency(row.original.agreedPrice)}</span>
                    <span className="text-[9px] font-black text-green-700 uppercase tracking-widest">
                        {formatCurrency(row.original.agreedPrice * (row.original.commissionRate / 100))} (Fee)
                    </span>
                </div>
            )
        },
        { 
            header: 'Status',
            cell: ({row}) => (
                <Badge variant={row.original.status === 'concluded' ? 'default' : 'secondary'} className="capitalize text-[10px] font-black">
                    {row.original.status?.replace(/_/g, ' ')}
                </Badge>
            )
        },
        {
            id: 'actions',
            header: <div className="text-right">Action</div>,
            cell: ({ row }) => (
                <div className="flex justify-end gap-2">
                    {row.original.status === 'finance_pending' && (
                        <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white font-bold uppercase text-[10px]" onClick={() => handleFinalize(row.original)} disabled={!!isActionLoading}>
                            {isActionLoading === row.original.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <Scale className="h-4 w-4 mr-1" />}
                            Conclude
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" asChild className="h-8">
                        <Link href={`/adminaccount?view=wallet&memberId=${row.original.buyerId}`}><ArrowRight className="h-4 w-4" /></Link>
                    </Button>
                </div>
            )
        }
    ];

    if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-8 text-left text-foreground">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 text-left">
                <div className="text-left">
                    <h1 className="text-3xl font-black font-headline tracking-tight flex items-center gap-3">
                        <ShoppingCart className="h-8 w-8 text-primary" />
                        Buy & Sell Mall Oversight
                    </h1>
                    <p className="text-muted-foreground mt-1">Management of global vehicle inventory and concluding sales transactions.</p>
                </div>
                <Button variant="outline" onClick={loadData} className="gap-2">
                    <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    Refresh Mall
                </Button>
            </div>

            <Tabs defaultValue="ledger" className="w-full text-left">
                <TabsList className="bg-muted/50 p-1 h-auto flex-wrap justify-start">
                    <TabsTrigger value="ledger" className="gap-2 px-6 py-2.5 font-bold uppercase tracking-widest text-[10px]">
                        <FileText className="h-3.5 w-3.5" /> Global Sales Ledger
                    </TabsTrigger>
                    <TabsTrigger value="inventory" className="gap-2 px-6 py-2.5 font-bold uppercase tracking-widest text-[10px]">
                        <Truck className="h-3.5 w-3.5" /> Community Inventory
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="ledger" className="mt-8 text-left">
                    <Card className="border-none shadow-xl">
                        <CardHeader className="border-b bg-muted/10">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Handshake className="h-5 w-5 text-primary" />
                                Active Transactions
                            </CardTitle>
                            <CardDescription>Reviewing price negotiations and finance triggers.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 text-left">
                            <DataTable columns={saleColumns} data={sales} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="inventory" className="mt-8 text-left">
                    <Card className="border-none shadow-xl">
                        <CardHeader className="border-b bg-muted/10">
                            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                                <Database className="h-5 w-5 text-primary" />
                                National Vehicle Registry
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 text-left">
                             <DataTable 
                                data={inventory}
                                columns={[
                                    { header: 'Asset', cell: ({row}) => <span className="font-bold">{row.original.year} {row.original.make} {row.original.model}</span> },
                                    { header: 'Price', cell: ({row}) => <span className="font-black">{formatCurrency(row.original.price)}</span> },
                                    { header: 'Location', accessorKey: 'location' },
                                    { header: 'Status', cell: ({row}) => <Badge className="capitalize text-[10px]">{row.original.status}</Badge> }
                                ]}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
