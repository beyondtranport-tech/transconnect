
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PlusCircle, FileSignature, Edit, Eye, ArrowLeft, Banknote, Users, CheckCircle, AlertCircle } from "lucide-react";
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getClientSideAuthToken } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import { AgreementWizard } from './edit-agreement';
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
    pending: 'secondary',
    credit: 'outline',
    payout: 'outline',
    active: 'default',
    completed: 'destructive',
    defaulted: 'destructive'
};

export default function AgreementsContent() {
    const [view, setView] = useState<'list' | 'wizard'>('list');
    const [agreements, setAgreements] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [facilities, setFacilities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    
    const [selectedAgreement, setSelectedAgreement] = useState<any | null>(null);

    const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);

    const forceRefresh = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            
            const [agreementsRes, clientsRes, facilitiesRes] = await Promise.all([
                performAdminAction(token, 'getLendingData', { collectionName: 'agreements' }),
                performAdminAction(token, 'getLendingData', { collectionName: 'lendingClients' }),
                performAdminAction(token, 'getLendingData', { collectionName: 'facilities' })
            ]);
            
            setAgreements(agreementsRes.data || []);
            setClients(clientsRes.data || []);
            setFacilities(facilitiesRes.data || []);

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
    
    const handleAddNew = () => {
        setSelectedAgreement(null);
        setView('wizard');
    };

    const handleEdit = (agreement: any) => {
        setSelectedAgreement(agreement);
        setView('wizard');
    };
    
    const handleBackToList = () => {
        setView('wizard');
        setSelectedAgreement(null);
    };

    const handleSaveSuccess = () => {
        forceRefresh();
        setView('list');
        setSelectedAgreement(null);
    };

    const columns: ColumnDef<any>[] = useMemo(() => [
        { 
            header: 'Client',
            cell: ({ row }) => <div>{clientMap.get(row.original.clientId) || 'Unknown Client'}</div>
        },
        { accessorKey: 'description', header: 'Description' },
        { accessorKey: 'totalAdvanced', header: 'Amount', cell: ({ row }) => formatCurrency(row.original.totalAdvanced) },
        { accessorKey: 'type', header: 'Type', cell: ({row}) => <Badge variant="outline" className="capitalize">{row.original.type?.replace(/-/g, ' ')}</Badge> },
        { accessorKey: 'status', header: 'Status', cell: ({row}) => <Badge variant={statusColors[row.original.status] || 'secondary'} className="capitalize">{row.original.status?.replace(/_/g, ' ')}</Badge> },
        { accessorKey: 'createDate', header: 'Date Created', cell: ({row}) => formatDateSafe(row.original.createDate) },
        { id: 'actions', header: <div className="text-right">Actions</div>, cell: ({ row }) => (
            <div className="text-right">
                 <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original)}>
                    <Edit className="h-4 w-4" />
                </Button>
            </div>
        )},
    ], [clientMap]);
    
    if (error) {
        return <Card className="bg-destructive/10 border-destructive text-destructive-foreground"><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent>{error}</CardContent></Card>
    }

    if (view === 'wizard') {
        return (
            <AgreementWizard
                agreement={selectedAgreement}
                clients={clients}
                facilities={facilities}
                onSave={handleSaveSuccess}
                onBack={handleBackToList}
            />
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2"><FileSignature /> Lending Agreements</CardTitle>
                    <CardDescription>Manage all active and pending lending agreements.</CardDescription>
                </div>
                <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4"/>New Agreement</Button>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : (
                    <DataTable columns={columns} data={agreements} />
                )}
            </CardContent>
        </Card>
    );
}
