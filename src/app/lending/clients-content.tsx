
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import { Loader2, PlusCircle, Users, Edit, Trash2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { EditClient } from './edit-client';

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

// Main Component
export default function ClientsContent() {
    const { toast } = useToast();
    const [clients, setClients] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [view, setView] = useState<'list' | 'edit'>('list');
    const [selectedClient, setSelectedClient] = useState<any | null>(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<any | null>(null);

    const forceRefresh = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            const result = await performAdminAction(token, 'getLendingData', { collectionName: 'lendingClients' });
            setClients(result.data || []);
        } catch (e: any) {
            setError(e.message);
            toast({ variant: 'destructive', title: 'Error loading clients', description: e.message });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);
    
    useEffect(() => {
        forceRefresh();
    }, [forceRefresh]);

    const handleEdit = (client: any) => {
        setSelectedClient(client);
        setView('edit');
    };

    const handleAddNew = () => {
        setSelectedClient(null);
        setView('edit');
    };
    
    const handleBackToList = () => {
        setView('list');
        setSelectedClient(null);
    };

    const handleSaveSuccess = () => {
        forceRefresh();
        handleBackToList();
    };

    const handleDelete = async () => {
        if (!clientToDelete) return;
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            await performAdminAction(token, 'deleteLendingPartner', { collection: 'lendingClients', partnerId: clientToDelete.id });
            toast({ title: 'Client Deleted' });
            forceRefresh();
            setClientToDelete(null);
            setIsDeleteAlertOpen(false);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
        }
    };

    const columns: ColumnDef<any>[] = useMemo(() => [
        { accessorKey: 'name', header: 'Name', cell: ({row}) => <div>{row.original.name}</div> },
        { accessorKey: 'contactPerson', header: 'Contact Person', cell: ({row}) => <div>{row.original.contactPerson}</div> },
        { accessorKey: 'email', header: 'Email', cell: ({row}) => <div>{row.original.email}</div> },
        { accessorKey: 'status', header: 'Status', cell: ({row}) => <Badge className="capitalize">{row.original.status}</Badge>},
        { id: 'actions', header: <div className="text-right">Actions</div>, cell: ({ row }) => (
            <div className="flex justify-end items-center gap-1">
                <Button asChild variant="ghost" size="icon"><Link href={`/lending/clients/${row.original.id}`}><Eye className="h-4 w-4" /></Link></Button>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => { setClientToDelete(row.original); setIsDeleteAlertOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
        ) },
    ], []);
    
    if (error) {
        return <Card className="bg-destructive/10 border-destructive text-destructive-foreground"><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent>{error}</CardContent></Card>
    }

    if (view === 'edit') {
        return <EditClient client={selectedClient} onSave={handleSaveSuccess} onBack={handleBackToList} />;
    }

    return (
        <>
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete client "{clientToDelete?.name}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setClientToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>Yes, delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2"><Users /> Clients (Debtors)</CardTitle>
                        <CardDescription>Manage all clients within the lending system.</CardDescription>
                    </div>
                    <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4"/>Add Client</Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : (
                        <DataTable columns={columns} data={clients} />
                    )}
                </CardContent>
            </Card>
        </>
    );
}
