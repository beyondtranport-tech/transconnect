
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { 
    Loader2, Truck, Handshake, ShieldCheck, Search, FileText, CheckCircle, 
    XCircle, ArrowRight, RefreshCcw, DollarSign, Database, Gavel, Scale, Settings2, ShoppingCart, Tag
} from 'lucide-react';
import { getClientSideAuthToken } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDateSafe, cn } from '@/lib/utils';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

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
    const [negotiateSale, setNegotiateSale] = useState<any | null>(null);
    const [newCommissionRate, setNewCommissionRate] = useState<number>(2.5);
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
            await performAdminAction(token, 'finalizeSale', { 
                saleId: sale.id,
                commissionRate: sale.commissionRate // Pass adjusted rate
            });
            toast({ title: "Sale Concluded", description: "Funds disbursed and commission isolated." });
            loadData();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Finalization Failed", description: e.message });
        } finally {
            setIsActionLoading(null);
        }
    };

    const handleAdjustCommission = async () => {
        if (!negotiateSale) return;
        setIsActionLoading(negotiateSale.id);
        try {
            const token = await getClientSideAuthToken();
            await fetch('/api/updateUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    path: `sales/${negotiateSale.id}`, 
                    data: { commissionRate: newCommissionRate, updatedAt: { _methodName: 'serverTimestamp' } } 
                }),
            });
            toast({ title: "Commission Rate Adjusted" });
            setNegotiateSale(null);
            loadData();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Adjustment Failed" });
        } finally {
            setIsActionLoading(null);
        }
    };

    const saleColumns: ColumnDef<any>[] = [
        { 
            header: 'Handshake Node',
            cell: ({row}) => (
                <div className="flex flex-col text-left">
                    <span className="font-bold text-foreground text-left">{row.original.vehicleName || 'Asset Handshake'}</span>
                    <span className="text-[9px] text-muted-foreground font-mono uppercase text-left">{row.original.id}</span>
                </div>
            )
        },
        { 
            header: 'Parties (B vs S)',
            cell: ({row}) => (
                <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-blue-600 text-left">Buyer: {row.original.buyerName}</span>
                    <span className="text-xs font-bold text-slate-600 text-left">Seller: {row.original.sellerName}</span>
                </div>
            )
        },
        { 
            header: 'Yield Logic',
            cell: ({row}) => (
                <div className="flex flex-col text-left">
                    <span className="font-black text-foreground text-left">{formatCurrency(row.original.agreedPrice)}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-black text-green-700 uppercase tracking-widest text-left">
                            {formatCurrency(row.original.agreedPrice * ((row.original.commissionRate || 2.5) / 100))}
                        </span>
                        <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-primary/20 text-primary font-black uppercase text-left">
                            @{row.original.commissionRate || 2.5}%
                        </Badge>
                    </div>
                </div>
            )
        },
        { 
            header: 'Stage',
            cell: ({row}) => (
                <Badge variant={row.original.status === 'concluded' ? 'default' : 'secondary'} className="capitalize text-[10px] font-black tracking-widest text-left">
                    {row.original.status?.replace(/_/g, ' ')}
                </Badge>
            )
        },
        {
            id: 'actions',
            header: <div className="text-right text-left">Actions</div>,
            cell: ({ row }) => (
                <div className="flex justify-end gap-1.5 text-left text-foreground">
                    <Button variant="ghost" size="icon" onClick={() => { setNegotiateSale(row.original); setNewCommissionRate(row.original.commissionRate || 2.5); }} title="Adjust Commercials">
                        <Settings2 className="h-4 w-4" />
                    </Button>
                    {row.original.status === 'delivered' && (
                        <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white font-bold uppercase text-[9px] tracking-widest text-left" onClick={() => handleFinalize(row.original)} disabled={!!isActionLoading}>
                            {isActionLoading === row.original.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <Scale className="h-4 w-4 mr-1" />}
                            Conclude Deal
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" asChild title="View Seller Wallet">
                        <Link href={`/adminaccount?view=wallet&memberId=${row.original.sellerId}`}><ArrowRight className="h-4 w-4" /></Link>
                    </Button>
                </div>
            )
        }
    ];

    if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-8 text-left text-foreground">
            <Dialog open={!!negotiateSale} onOpenChange={(o) => !o && setNegotiateSale(null)}>
                <DialogContent className="max-w-md text-left text-foreground">
                    <DialogHeader>
                        <DialogTitle className="text-left">Adjust Platform Commercials</DialogTitle>
                        <DialogDescription className="text-left">Override the standard 2.5% commission rate for this transaction.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4 text-left text-foreground">
                        <div className="space-y-2 text-left text-foreground text-foreground">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Negotiated Rate (%)</Label>
                            <Input type="number" step="0.1" value={newCommissionRate} onChange={e => setNewCommissionRate(Number(e.target.value))} className="h-12 text-xl font-black" />
                        </div>
                        <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-2 text-left">
                            <div className="flex justify-between text-xs">
                                <span>Platform Yield:</span>
                                <span className="font-black text-green-700">{formatCurrency((negotiateSale?.agreedPrice || 0) * (newCommissionRate / 100))}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span>Seller Net:</span>
                                <span className="font-bold">{formatCurrency((negotiateSale?.agreedPrice || 0) * (1 - newCommissionRate / 100))}</span>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNegotiateSale(null)}>Cancel</Button>
                        <Button onClick={handleAdjustCommission} disabled={!!isActionLoading}>
                            {isActionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2"/>}
                            Update Commercials
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 text-left">
                <div className="text-left text-foreground text-left">
                    <h1 className="text-3xl font-black font-headline tracking-tight flex items-center gap-3 text-left text-foreground text-left">
                        <ShoppingCart className="h-8 w-8 text-primary" />
                        Buy & Sell Mall Oversight
                    </h1>
                    <p className="text-muted-foreground mt-1 text-left">Oversight of global vehicle inventory and concluding handshakes.</p>
                </div>
                <Button variant="outline" onClick={loadData} className="gap-2 text-foreground text-left">
                    <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    Refresh Mall Data
                </Button>
            </div>

            <Tabs defaultValue="ledger" className="w-full text-left text-foreground">
                <TabsList className="bg-muted/50 p-1 h-auto flex-wrap justify-start text-left text-foreground">
                    <TabsTrigger value="ledger" className="gap-2 px-6 py-2.5 font-bold uppercase tracking-widest text-[10px]">
                        <FileText className="h-3.5 w-3.5" /> Global Handshake Ledger
                    </TabsTrigger>
                    <TabsTrigger value="inventory" className="gap-2 px-6 py-2.5 font-bold uppercase tracking-widest text-[10px]">
                        <Truck className="h-3.5 w-3.5" /> Community Inventory
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="ledger" className="mt-8 text-left text-foreground text-foreground">
                    <Card className="border-none shadow-xl text-left">
                        <CardHeader className="border-b bg-muted/10 text-left text-foreground">
                            <CardTitle className="text-lg flex items-center gap-2 text-foreground text-left text-foreground">
                                <Handshake className="h-5 w-5 text-primary" />
                                Active Handshakes
                            </CardTitle>
                            <CardDescription className="text-left">Reviewing price negotiations and finance division triggers.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 text-left text-foreground text-foreground">
                            <DataTable columns={saleColumns} data={sales} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="inventory" className="mt-8 text-left text-foreground">
                    <Card className="border-none shadow-xl text-left text-foreground">
                        <CardHeader className="border-b bg-muted/10 text-left text-foreground text-left">
                            <CardTitle className="text-lg flex items-center gap-2 text-foreground text-left text-foreground">
                                <Database className="h-5 w-5 text-primary" />
                                National Vehicle Registry
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 text-left text-foreground text-foreground">
                             <DataTable 
                                data={inventory}
                                columns={[
                                    { header: 'Asset / Entity', cell: ({row}) => (
                                        <div className="flex flex-col text-left">
                                            <span className="font-bold text-left">{row.original.year} {row.original.make} {row.original.model}</span>
                                            <span className="text-[9px] text-muted-foreground uppercase text-left">{row.original.companyName}</span>
                                        </div>
                                    )},
                                    { header: 'List Price', cell: ({row}) => <span className="font-black text-left">{formatCurrency(row.original.price)}</span> },
                                    { header: 'Region', accessorKey: 'location' },
                                    { header: 'Status', cell: ({row}) => <Badge className="capitalize text-[10px] font-black text-left">{row.original.status}</Badge> }
                                ]}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

