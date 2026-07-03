'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Truck, Handshake, ShieldCheck, Search, FileText, CheckCircle, XCircle, ArrowRight, RefreshCcw, DollarSign, Database } from 'lucide-react';
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

export default function LoadsOversight() {
    const [agreements, setAgreements] = useState<any[]>([]);
    const [loads, setLoads] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
    const { toast } = useToast();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;

            const [agreementsRes, loadsRes] = await Promise.all([
                performAdminAction(token, 'getBrokerAgreements'),
                performAdminAction(token, 'getGlobalLoads')
            ]);

            setAgreements(agreementsRes.data || []);
            setLoads(loadsRes.data || []);
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Oversight Load Failed", description: e.message });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleVerifyAgreement = async (agreement: any, status: 'verified' | 'rejected') => {
        setIsActionLoading(agreement.id);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;

            await performAdminAction(token, 'updateBrokerAgreementStatus', { 
                path: agreement.path, 
                status 
            });

            toast({ title: `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}` });
            loadData();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Action Failed", description: e.message });
        } finally {
            setIsActionLoading(null);
        }
    };

    const agreementColumns: ColumnDef<any>[] = [
        { 
            header: 'Member / Broker',
            cell: ({row}) => (
                <div className="flex flex-col text-left">
                    <span className="font-bold text-foreground">{row.original.brokerName}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{row.original.brokerId}</span>
                </div>
            )
        },
        { accessorKey: 'providerName', header: 'Load Provider' },
        { 
            header: 'Documents',
            cell: ({row}) => (
                <Button variant="ghost" size="sm" asChild className="h-8 text-[10px] font-black uppercase text-primary gap-1">
                    <a href={row.original.agreementUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-3 w-3" /> View Signed Letter
                    </a>
                </Button>
            )
        },
        { 
            header: 'Status',
            cell: ({row}) => (
                <Badge variant={row.original.status === 'verified' ? 'default' : 'secondary'} className="capitalize text-[10px] font-black">
                    {row.original.status}
                </Badge>
            )
        },
        {
            id: 'actions',
            header: <div className="text-right">Authorization</div>,
            cell: ({ row }) => (
                <div className="flex justify-end gap-2">
                    {row.original.status === 'pending' && (
                        <>
                            <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleVerifyAgreement(row.original, 'verified')} disabled={!!isActionLoading}>
                                {isActionLoading === row.original.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <CheckCircle className="h-4 w-4 mr-1" />}
                                Verify
                            </Button>
                            <Button size="sm" variant="destructive" className="h-8" onClick={() => handleVerifyAgreement(row.original, 'rejected')} disabled={!!isActionLoading}>
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                            </Button>
                        </>
                    )}
                </div>
            )
        }
    ];

    const loadColumns: ColumnDef<any>[] = [
        { 
            header: 'Route',
            cell: ({row}) => (
                <div className="flex items-center gap-2 font-bold text-sm text-foreground text-left">
                    {row.original.origin} <ArrowRight className="h-3 w-3 opacity-30" /> {row.original.destination}
                </div>
            )
        },
        { 
            header: 'Broker',
            cell: ({row}) => <span className="text-xs font-medium">{row.original.brokerName}</span>
        },
        { 
            header: 'Yield (Platform)',
            cell: ({row}) => (
                <div className="flex flex-col text-left">
                    <span className="font-black text-green-700">{formatCurrency(row.original.platformFee)}</span>
                    <span className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">2.5% Success Fee</span>
                </div>
            )
        },
        { 
            header: 'Technical Specs',
            cell: ({row}) => (
                <div className="flex flex-wrap gap-1 max-w-[150px]">
                    {(row.original.requiredEquipment || []).map((eq: string) => (
                        <Badge key={eq} variant="outline" className="text-[8px] h-3.5 px-1 border-primary/20 text-primary uppercase font-bold">{eq}</Badge>
                    ))}
                </div>
            )
        },
        { 
            header: 'Status',
            cell: ({row}) => <Badge className="capitalize text-[9px] font-black tracking-widest">{row.original.status}</Badge>
        }
    ];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Synchronizing Loads Mall Data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 text-left text-foreground">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="text-left">
                    <h1 className="text-3xl font-black font-headline tracking-tight flex items-center gap-3">
                        <Truck className="h-8 w-8 text-primary" />
                        Loads Mall Oversight
                    </h1>
                    <p className="text-muted-foreground mt-1">Management of subcontractor authorizations and national freight registry.</p>
                </div>
                <Button variant="outline" onClick={loadData} className="gap-2">
                    <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    Refresh Mall Data
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2 text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pending Handshakes</p>
                    </CardHeader>
                    <CardContent className="text-left">
                        <div className="text-3xl font-black text-primary">{agreements.filter(a => a.status === 'pending').length}</div>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-100">
                    <CardHeader className="pb-2 text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Loads</p>
                    </CardHeader>
                    <CardContent className="text-left">
                        <div className="text-3xl font-black text-blue-700">{loads.filter(l => l.status === 'active').length}</div>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-100">
                    <CardHeader className="pb-2 text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Platform Yield</p>
                    </CardHeader>
                    <CardContent className="text-left">
                        <div className="text-3xl font-black text-green-700">
                            {formatCurrency(loads.reduce((sum, l) => sum + (l.platformFee || 0), 0))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="authorizations" className="w-full">
                <TabsList className="bg-muted/50 p-1 h-auto flex-wrap justify-start">
                    <TabsTrigger value="authorizations" className="gap-2 px-6 py-2.5 font-bold uppercase tracking-widest text-[10px]">
                        <ShieldCheck className="h-3.5 w-3.5" /> Broker Authorization Queue
                    </TabsTrigger>
                    <TabsTrigger value="registry" className="gap-2 px-6 py-2.5 font-bold uppercase tracking-widest text-[10px]">
                        <Database className="h-3.5 w-3.5" /> Global Loads Board
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="authorizations" className="mt-8">
                    <Card className="border-none shadow-xl">
                        <CardHeader className="border-b bg-muted/10">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Handshake className="h-5 w-5 text-primary" />
                                Subcontractor Appointments
                            </CardTitle>
                            <CardDescription>Verify signed appointment letters to authorize load distribution.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <DataTable columns={agreementColumns} data={agreements} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="registry" className="mt-8">
                    <Card className="border-none shadow-xl">
                        <CardHeader className="border-b bg-muted/10">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Search className="h-5 w-5 text-primary" />
                                National Freight Audit
                            </CardTitle>
                            <CardDescription>Comprehensive view of all loads currently active or historical in the ecosystem.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <DataTable columns={loadColumns} data={loads} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
