
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PlusCircle, Truck, Edit, Trash2, Warehouse, Wrench, ArrowLeft, FileText, Handshake, Car, Bus, Monitor, RefreshCcw } from "lucide-react";
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { getClientSideAuthToken } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, fetchFromAdminAPI } from '@/lib/utils';
import { EditAssetWizard } from './edit-asset';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
    available: 'default',
    financed: 'outline',
    sold: 'secondary',
    decommissioned: 'destructive'
};

function AssetTypeSelection({ onSelect, onBack }: { onSelect: (type: string) => void, onBack: () => void }) {
    const types = [
        { id: 'Truck', label: 'Truck', icon: Truck },
        { id: 'Trailer', label: 'Trailer', icon: Warehouse },
        { id: 'Car', label: 'Car', icon: Car },
        { id: 'Bus', label: 'Bus', icon: Bus },
        { id: 'Equipment', label: 'Equipment', icon: Wrench },
    ];

    return (
        <Card className="border-none shadow-2xl text-left bg-white overflow-hidden">
            <CardHeader className="bg-slate-900 text-white p-8">
                <div className="flex justify-between items-start">
                    <div className="text-left text-white">
                        <CardTitle className="text-2xl font-black font-headline uppercase">Initialize Asset Node</CardTitle>
                        <CardDescription className="text-slate-400">Select the technical classification for the new registry entry.</CardDescription>
                    </div>
                    <Button variant="ghost" onClick={onBack} className="text-white hover:text-primary"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Registry</Button>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 p-8 text-left text-foreground">
                {types.map(type => {
                    const Icon = type.icon;
                    return (
                        <div key={type.id} className="group p-6 border-2 rounded-3xl text-center hover:shadow-xl hover:border-primary transition-all cursor-pointer bg-white" onClick={() => onSelect(type.id)}>
                            <div className="bg-primary/5 p-4 rounded-2xl w-fit mx-auto group-hover:bg-primary transition-colors">
                                <Icon className="h-10 w-10 text-primary group-hover:text-white" />
                            </div>
                            <h3 className="mt-4 text-sm font-black uppercase tracking-widest">{type.label}</h3>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}

export default function AssetRegisterContent() {
    const searchParams = useSearchParams();
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

    const forceRefresh = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            
            const [assetsRes, clientsRes] = await Promise.all([
                fetchFromAdminAPI(token, 'getLendingData', { collectionName: 'lendingAssets' }),
                fetchFromAdminAPI(token, 'getLendingData', { collectionName: 'lendingClients' })
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
        
        // HANDSHAKE PROTOCOL: Detect intent to add specific asset
        const targetType = searchParams.get('type');
        if (targetType) {
            setAssetType(targetType);
            setView('wizard');
        }
    }, [forceRefresh, searchParams]);

    const handleEdit = (asset: any) => {
        setSelectedAsset(asset);
        setAssetType(asset.classification || null);
        setView('wizard');
    };

    const handleAddNew = () => setView('select-type');
    const handleBackToList = () => { setView('list'); setSelectedAsset(null); setAssetType(null); };
    const handleSaveSuccess = () => { forceRefresh(); handleBackToList(); };
    const handleTypeSelect = (type: string) => { setSelectedAsset(null); setAssetType(type); setView('wizard'); };

    const handleDelete = async () => {
        if (!assetToDelete) return;
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            await fetchFromAdminAPI(token, 'deleteLendingAsset', { assetId: assetToDelete.id });
            toast({ title: 'Asset Node Expunged' });
            forceRefresh();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
        } finally {
            setAssetToDelete(null);
            setIsDeleteAlertOpen(false);
        }
    };

    const columns: ColumnDef<any>[] = [
        { 
            header: 'Asset Identity',
            cell: ({row}) => (
                <div className="flex flex-col text-left">
                    <span className="font-bold text-foreground text-left">{row.original.year} {row.original.make} {row.original.model}</span>
                    <span className="text-[10px] text-muted-foreground font-mono uppercase text-left">{row.original.id}</span>
                </div>
            )
        },
        { header: 'Class', cell: ({row}) => <Badge variant="outline" className="capitalize text-[10px] font-black">{row.original.classification || 'Vehicle'}</Badge> },
        { accessorKey: 'costOfSale', header: 'Valuation', cell: ({ row }) => <span className="font-black text-primary">{formatCurrency(row.original.costOfSale)}</span> },
        { accessorKey: 'status', header: 'Status', cell: ({row}) => <Badge variant={statusColors[row.original.status] || 'secondary'} className="capitalize text-[10px] font-black">{row.original.status}</Badge> },
        { accessorKey: 'registrationNumber', header: 'Reg #' },
        { id: 'actions', header: <div className="text-right">Audit</div>, cell: ({ row }) => (
            <div className="text-right flex justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => { setAssetToDelete(row.original); setIsDeleteAlertOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
        )},
    ];
    
    if (view === 'select-type') return <AssetTypeSelection onSelect={handleTypeSelect} onBack={handleBackToList} />;
    if (view === 'wizard') return <EditAssetWizard asset={selectedAsset} assetType={assetType} onSave={handleSaveSuccess} onBack={handleBackToList} />;

    return (
        <div className="space-y-8 text-left text-foreground">
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent className="text-left text-foreground"><AlertDialogHeader className="text-left text-foreground"><AlertDialogTitle className="text-left">Expunge Asset Node?</AlertDialogTitle><AlertDialogDescription className="text-left">Permanent removal of this technical record.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter className="text-left"><AlertDialogCancel onClick={() => setAssetToDelete(null)}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className={cn(buttonVariants({ variant: "destructive" }))}>Delete Node</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
            </AlertDialog>
            
            <div className="flex justify-between items-end">
                <div className="text-left">
                    <h1 className="text-3xl font-black font-headline tracking-tight flex items-center gap-3 text-left">
                        <Truck className="h-8 w-8 text-primary" />
                        Asset Register
                    </h1>
                    <p className="text-muted-foreground mt-1 text-left">Management of all physical collateral and technical data nodes.</p>
                </div>
                <div className="flex gap-2 text-left">
                    <Button variant="outline" size="sm" onClick={forceRefresh} disabled={isLoading} className="gap-2">
                        <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} /> Refresh
                    </Button>
                    <Button onClick={handleAddNew} size="sm" className="gap-2 font-bold shadow-lg text-white">
                        <PlusCircle className="h-4 w-4" /> New Asset Node
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-xl bg-white text-left text-foreground">
                <CardContent className="pt-6 text-left text-foreground">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-20 text-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                    ) : (
                        <DataTable columns={columns} data={assets} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
