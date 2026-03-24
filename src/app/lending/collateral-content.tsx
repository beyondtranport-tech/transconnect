
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PlusCircle, Paperclip, Edit, Trash2, Download } from "lucide-react";
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Button, buttonVariants } from '@/components/ui/button';
import { getClientSideAuthToken } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { formatDateSafe } from '@/lib/utils';
import { EditSecurityWizard } from './edit-security';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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

export default function CollateralContent() {
    const [securities, setSecurities] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [agreements, setAgreements] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    
    const [view, setView] = useState<'list' | 'wizard'>('list');
    const [selectedSecurity, setSelectedSecurity] = useState<any | null>(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [securityToDelete, setSecurityToDelete] = useState<any | null>(null);

    const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);
    const agreementMap = useMemo(() => new Map(agreements.map(a => [a.id, a.description])), [agreements]);

    const forceRefresh = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            
            const [securitiesRes, clientsRes, agreementsRes] = await Promise.all([
                performAdminAction(token, 'getLendingData', { collectionName: 'securities' }),
                performAdminAction(token, 'getLendingData', { collectionName: 'lendingClients' }),
                performAdminAction(token, 'getLendingData', { collectionName: 'agreements' })
            ]);
            
            setSecurities(securitiesRes.data || []);
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

    const handleEdit = (security: any) => {
        setSelectedSecurity(security);
        setView('wizard');
    };

    const handleAddNew = () => {
        setSelectedSecurity(null);
        setView('wizard');
    };
    
    const handleBackToList = () => {
        setView('list');
        setSelectedSecurity(null);
    };
    
    const handleSaveSuccess = () => {
        forceRefresh();
        handleBackToList();
    };

    const handleDelete = async () => {
        if (!securityToDelete) return;
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            await performAdminAction(token, 'deleteLendingSecurity', {
                clientId: securityToDelete.clientId,
                agreementId: securityToDelete.agreementId,
                securityId: securityToDelete.id,
            });

            toast({ title: 'Security Document Deleted' });
            forceRefresh();
        } catch (e: any) {
             toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
        } finally {
            setSecurityToDelete(null);
            setIsDeleteAlertOpen(false);
        }
    };

    const columns: ColumnDef<any>[] = useMemo(() => [
        { header: 'Client', cell: ({ row }) => <Link href={`/lending/clients/${row.original.clientId}`} className="text-primary hover:underline">{clientMap.get(row.original.clientId) || 'Unknown'}</Link> },
        { header: 'Agreement', cell: ({ row }) => <div className="truncate max-w-xs">{agreementMap.get(row.original.agreementId) || 'N/A'}</div> },
        { accessorKey: 'documentName', header: 'Document Name' },
        { accessorKey: 'documentType', header: 'Type' },
        { header: 'Uploaded', cell: ({ row }) => formatDateSafe(row.original.createdAt) },
        { id: 'actions', header: <div className="text-right">Actions</div>, cell: ({ row }) => (
            <div className="text-right">
                <Button asChild variant="ghost" size="icon"><a href={row.original.fileUrl} target="_blank" rel="noopener noreferrer" title="Download"><Download className="h-4 w-4"/></a></Button>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original)} title="Edit"><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => { setSecurityToDelete(row.original); setIsDeleteAlertOpen(true); }} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
        )},
    ], [clientMap, agreementMap, forceRefresh]);
    
    if (error) {
        return <Card className="bg-destructive/10 border-destructive text-destructive-foreground"><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent>{error}</CardContent></Card>
    }
    
    if (view === 'wizard') {
        return <EditSecurityWizard security={selectedSecurity} clients={clients} agreements={agreements} onSave={handleSaveSuccess} onBack={handleBackToList} />;
    }

    return (
        <>
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete security document "{securityToDelete?.documentName}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSecurityToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>Yes, delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2"><Paperclip /> Collateral Management</CardTitle>
                        <CardDescription>Manage all security documents related to lending agreements.</CardDescription>
                    </div>
                    <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4"/>Add Document</Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : (
                        <DataTable columns={columns} data={securities} />
                    )}
                </CardContent>
            </Card>
        </>
    );
}
