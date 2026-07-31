
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PlusCircle, ShieldCheck, Lock, Search, Download, Trash2, Clock, Landmark, Gavel } from "lucide-react";
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { getClientSideAuthToken } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { formatDateSafe, cn } from '@/lib/utils';

async function performAdminAction(token: string, action: string, payload: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || `API Error: ${action}`);
    return result.data;
}

export default function SecurityVaultContent() {
    const [securities, setSecurities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            const res = await performAdminAction(token, 'getLendingData', { collectionName: 'securities' });
            setSecurities(res || []);
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Vault Load Failed", description: e.message });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => { loadData(); }, [loadData]);

    const columns: ColumnDef<any>[] = [
        {
            header: 'Security / Collateral',
            cell: ({ row }) => (
                <div className="flex flex-col text-left">
                    <span className="font-bold text-foreground text-left">{row.original.documentName || 'Security Doc'}</span>
                    <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="outline" className="text-[8px] h-3.5 uppercase font-black border-primary/20 text-primary">Collateral Node</Badge>
                        <span className="text-[9px] text-muted-foreground font-mono uppercase text-left">{row.original.id}</span>
                    </div>
                </div>
            )
        },
        { 
            header: 'Registry Type', 
            cell: ({row}) => <Badge variant="secondary" className="capitalize text-[10px] font-black">{row.original.documentType || 'Unregistered'}</Badge> 
        },
        { 
            header: 'Oversight', 
            cell: ({row}) => (
                <div className="flex items-center gap-2 text-muted-foreground text-left">
                    <Gavel className="h-3 w-3" />
                    <span className="text-[10px] font-bold uppercase">{formatDateSafe(row.original.createdAt, "dd MMM yyyy")}</span>
                </div>
            )
        },
        {
            id: 'actions',
            header: <div className="text-right">Audit</div>,
            cell: ({ row }) => (
                <div className="flex justify-end gap-1 text-left">
                    <Button variant="ghost" size="icon" asChild title="Download"><a href={row.original.fileUrl} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a></Button>
                    <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-8 text-left text-foreground">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 text-left">
                <div className="text-left text-foreground">
                    <h1 className="text-3xl font-black font-headline tracking-tight flex items-center gap-3 text-left">
                        <Lock className="h-8 w-8 text-primary" />
                        Security & Collateral Vault
                    </h1>
                    <p className="text-muted-foreground mt-1 text-left text-foreground">Repository for all collateral scans, pledges, and surety documentation.</p>
                </div>
                <Button className="font-bold gap-2 text-white shadow-lg h-11 px-8 text-left">
                    <PlusCircle className="h-4 w-4" /> Archive Security Node
                </Button>
            </div>

            <Card className="border-none shadow-xl bg-white text-left text-foreground">
                <CardContent className="pt-6 text-left text-foreground">
                    {isLoading ? (
                        <div className="flex justify-center p-20 text-left"><Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" /></div>
                    ) : securities.length > 0 ? (
                        <DataTable columns={columns} data={securities} />
                    ) : (
                        <div className="py-24 text-center space-y-4 text-left text-foreground">
                            <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest text-center">Vault Standby</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
