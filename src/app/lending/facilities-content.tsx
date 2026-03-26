'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PlusCircle, Banknote, Edit, Trash2 } from "lucide-react";
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { getClientSideAuthToken } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { EditFacilityWizard } from './edit-facility';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useRouter, useSearchParams } from 'next/navigation';

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
    active: 'default',
    inactive: 'destructive',
};

export default function FacilitiesContent() {
    const [facilities, setFacilities] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [partners, setPartners] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [view, setView] = useState<'list' | 'wizard'>('list');
    const [selectedFacility, setSelectedFacility] = useState<any | null>(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [facilityToDelete, setFacilityToDelete] = useState<any | null>(null);

    const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);
    const partnerMap = useMemo(() => new Map(partners.map(p => [p.id, p.name])), [partners]);

    const forceRefresh = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            
            const [facilitiesRes, clientsRes, partnersRes] = await Promise.all([
                performAdminAction(token, 'getLendingData', { collectionName: 'facilities' }),
                performAdminAction(token, 'getLendingData', { collectionName: 'lendingClients' }),
                performAdminAction(token, 'getLendingData', { collectionName: 'lendingPartners' })
            ]);
            
            setFacilities(facilitiesRes.data || []);
            setClients(clientsRes.data || []);
            setPartners(partnersRes.data || []);

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
    
    // This effect handles the redirection from the agreement wizard.
    useEffect(() => {
        if (searchParams.get('action') === 'create') {
            setSelectedFacility(null); // Clear previous selection
            setView('wizard');
            // Clean the URL query params to prevent re-triggering on refresh
            router.replace('/lending?view=facilities', { scroll: false });
        }
    }, [searchParams, router]);


    const handleEdit = (facility: any) => {
        setSelectedFacility(facility);
        setView('wizard');
    };

    const handleAddNew = () => {
        setSelectedFacility(null);
        setView('wizard');
    };
    
    const handleBackToList = () => {
        setView('list');
        setSelectedFacility(null);
    };

    const handleSaveSuccess = () => {
        forceRefresh();
        handleBackToList();
    };
    
    const handleDelete = async () => {
        if (!facilityToDelete) return;
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            await performAdminAction(token, 'deleteLendingFacility', { 
                clientId: facilityToDelete.clientId,
                facilityId: facilityToDelete.id 
            });
            toast({ title: 'Facility Deleted' });
            forceRefresh();
            setFacilityToDelete(null);
            setIsDeleteAlertOpen(false);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
        }
    };


    const columns: ColumnDef<any>[] = useMemo(() => [
        { header: 'Client', cell: ({ row }) => <div>{clientMap.get(row.original.clientId) || 'Unknown Client'}</div> },
        { header: 'Partner', cell: ({ row }) => <div>{partnerMap.get(row.original.partnerId) || 'N/A'}</div> },
        { accessorKey: 'type', header: 'Type', cell: ({row}) => <Badge variant="outline" className="capitalize">{row.original.type?.replace(/_/g, ' ')}</Badge> },
        { accessorKey: 'limit', header: 'Limit', cell: ({ row }) => formatCurrency(row.original.limit) },
        { accessorKey: 'status', header: 'Status', cell: ({row}) => <Badge variant={statusColors[row.original.status] || 'secondary'} className="capitalize">{row.original.status?.replace(/_/g, ' ')}</Badge> },
        { id: 'actions', header: <div className="text-right">Actions</div>, cell: ({ row }) => (
            <div className="text-right">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => { setFacilityToDelete(row.original); setIsDeleteAlertOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
        )},
    ], [clientMap, partnerMap]);
    
    if (error) {
        return <Card className="bg-destructive/10 border-destructive text-destructive-foreground"><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent>{error}</CardContent></Card>
    }
    
    if (view === 'wizard') {
        return <EditFacilityWizard facility={selectedFacility} clients={clients} partners={partners} onSave={handleSaveSuccess} onBack={handleBackToList} />;
    }

    return (
        <>
             <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete this credit facility.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setFacilityToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>Yes, delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2"><Banknote /> Credit Facilities</CardTitle>
                        <CardDescription>Manage all credit facilities granted to clients.</CardDescription>
                    </div>
                    <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4"/>New Facility</Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : (
                        <DataTable columns={columns} data={facilities} />
                    )}
                </CardContent>
            </Card>
        </>
    );
}
