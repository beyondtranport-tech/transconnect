'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PlusCircle, Truck, Edit, Trash2, Warehouse, Wrench, ArrowLeft } from "lucide-react";
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { getClientSideAuthToken } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { EditAssetWizard } from './edit-asset';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

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
    available: 'default',
    financed: 'outline',
    sold: 'secondary',
    decommissioned: 'destructive'
};

// New component for type selection
function AssetTypeSelection({ onSelect, onBack }: { onSelect: (type: string) => void, onBack: () => void }) {
    const types = [
        { id: 'truck', label: 'Truck', icon: Truck },
        { id: 'trailer', label: 'Trailer', icon: Warehouse },
        { id: 'equipment', label: 'Equipment', icon: Wrench },
    ];

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Add New Asset</CardTitle>
                        <CardDescription>First, select the type of asset you want to register.</CardDescription>
                    </div>
                    <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4"/> Back to List</Button>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                {types.map(type => {
                    const Icon = type.icon;
                    return (
                        <Card key={type.id} className="text-center hover:shadow-lg hover:border-primary transition-all cursor-pointer" onClick={() => onSelect(type.label)}>
                            <CardContent className="p-6">
                                <Icon className="h-12 w-12 mx-auto text-primary" />
                                <h3 className="mt-4 text-lg font-semibold">{type.label}</h3>
                            </CardContent>
                        </Card>
                    );
                })}
            </CardContent>
        </Card>
    );
}

export default function AssetRegisterContent() {
    const [assets, setAssets] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    
    const [view, setView] = useState<'list' | 'wizard' | 'select-type'>('list');
    const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
    const [assetType, setAssetType] = useState<string | null>(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [assetToDelete, setAssetToDelete] = useState<any | null>(null);

    const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);

    const forceRefresh = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            
            const [assetsRes, clientsRes] = await Promise.all([
                performAdminAction(token, 'getLendingData', { collectionName: 'lendingAssets' }),
                performAdminAction(token, 'getLendingData', { collectionName: 'lendingClients' })
            ]);
            
            setAssets(assetsRes.data || []);
            setClients(clientsRes.data || []);

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

    const handleEdit = (asset: any) => {
        setSelectedAsset(asset);
        setAssetType(asset.classification || null);
        setView('wizard');
    };

    const handleAddNew = () => {
        setView('select-type');
    };
    
    const handleBackToList = () => {
        setView('list');
        setSelectedAsset(null);
        setAssetType(null);
    };

    const handleSaveSuccess = () => {
        forceRefresh();
        handleBackToList();
    };

    const handleTypeSelect = (type: string) => {
        setSelectedAsset(null);
        setAssetType(type);
        setView('wizard');
    };

    const handleDelete = async () => {
        if (!assetToDelete) return;
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            await performAdminAction(token, 'deleteLendingAsset', { assetId: assetToDelete.id });
            toast({ title: 'Asset Deleted' });
            forceRefresh();
            setAssetToDelete(null);
            setIsDeleteAlertOpen(false);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
        }
    };


    const columns: ColumnDef<any>[] = useMemo(() => [
        { 
            header: 'Client',
            cell: ({ row }) => <div>{clientMap.get(row.original.clientId) || 'Unknown Client'}</div>
        },
        { header: 'Asset', cell: ({row}) => `${row.original.year} ${row.original.make} ${row.original.model}` },
        { accessorKey: 'costOfSale', header: 'Cost', cell: ({ row }) => formatCurrency(row.original.costOfSale) },
        { accessorKey: 'status', header: 'Status', cell: ({row}) => <Badge variant={statusColors[row.original.status] || 'secondary'} className="capitalize">{row.original.status?.replace(/_/g, ' ')}</Badge> },
        { accessorKey: 'registrationNumber', header: 'Registration #' },
        { id: 'actions', header: <div className="text-right">Actions</div>, cell: ({ row }) => (
            <div className="text-right">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => { setAssetToDelete(row.original); setIsDeleteAlertOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
        )},
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [clientMap]);
    
    if (error) {
        return <Card className="bg-destructive/10 border-destructive text-destructive-foreground"><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent>{error}</CardContent></Card>
    }

    if (view === 'select-type') {
        return <AssetTypeSelection onSelect={handleTypeSelect} onBack={handleBackToList} />;
    }

    if (view === 'wizard') {
        return <EditAssetWizard asset={selectedAsset} assetType={assetType} clients={clients} onSave={handleSaveSuccess} onBack={handleBackToList} />;
    }

    return (
        <>
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the asset "{assetToDelete?.year} {assetToDelete?.make} {assetToDelete?.model}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setAssetToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>Yes, delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2"><Truck /> Asset Register</CardTitle>
                        <CardDescription>Manage all financed assets in the lending system.</CardDescription>
                    </div>
                    <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4"/>Add Asset</Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : (
                        <DataTable columns={columns} data={assets} />
                    )}
                </CardContent>
            </Card>
        </>
    );
}
