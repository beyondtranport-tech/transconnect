'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CalendarCheck, FileSignature, User } from "lucide-react";
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getClientSideAuthToken } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import Link from 'next/link';

// API Helper
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

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
    due: 'secondary',
    paid: 'default',
    overdue: 'destructive',
    skipped: 'outline'
};

export default function PaymentsContent() {
    const [payments, setPayments] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [agreements, setAgreements] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);
    const agreementMap = useMemo(() => new Map(agreements.map(a => [a.id, a.description])), [agreements]);

    const forceRefresh = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            
            const [paymentsRes, clientsRes, agreementsRes] = await Promise.all([
                performAdminAction(token, 'getLendingData', { collectionName: 'payments' }),
                performAdminAction(token, 'getLendingData', { collectionName: 'lendingClients' }),
                performAdminAction(token, 'getLendingData', { collectionName: 'agreements' })
            ]);
            
            setPayments(paymentsRes.data || []);
            setClients(clientsRes.data || []);
            setAgreements(agreementsRes.data || []);

        } catch (e: any) {
            setError(e.message);
            toast({ variant: 'destructive', title: 'Error loading data', description: e.message });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);
    
    useEffect(() => {
        forceRefresh();
    }, [forceRefresh]);

    const columns: ColumnDef<any>[] = useMemo(() => [
        { 
            header: 'Due Date',
            cell: ({ row }) => formatDateSafe(row.original.dueDate, "dd MMM yyyy")
        },
        { 
            header: 'Client',
            cell: ({ row }) => (
                <Link href={`/lending/clients/${row.original.clientId}`} className="text-primary hover:underline">
                    {clientMap.get(row.original.clientId) || 'Unknown Client'}
                </Link>
            )
        },
        { 
            header: 'Agreement', 
            cell: ({ row }) => <div className="truncate max-w-xs">{agreementMap.get(row.original.agreementId) || 'N/A'}</div> 
        },
        { 
            accessorKey: 'amount', 
            header: 'Amount', 
            cell: ({ row }) => formatCurrency(row.original.amount) 
        },
        { 
            accessorKey: 'status', 
            header: 'Status', 
            cell: ({row}) => <Badge variant={statusColors[row.original.status] || 'secondary'} className="capitalize">{row.original.status?.replace(/_/g, ' ')}</Badge> 
        },
    ], [clientMap, agreementMap]);
    
    if (error) {
        return <Card className="bg-destructive/10 border-destructive text-destructive-foreground"><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent>{error}</CardContent></Card>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CalendarCheck className="h-6 w-6" />
                    Payment Schedules
                </CardTitle>
                <CardDescription>View upcoming and historical payments across all lending agreements.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : (
                    <DataTable columns={columns} data={payments} />
                )}
            </CardContent>
        </Card>
    );
}
