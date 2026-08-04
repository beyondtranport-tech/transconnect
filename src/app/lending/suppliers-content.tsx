'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { 
  Loader2, PlusCircle, Building, Edit, Trash2, Eye, Database, SearchCode, History, RotateCcw, 
  Download, Upload, Zap, Search, Globe, ShieldCheck, Scale, FileCheck, ShoppingBag
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { EditClientWizard } from './edit-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, downloadDataAsCSV, formatDateSafe, fetchFromAdminAPI } from '@/lib/utils';
import AudienceCommunicationsTable from '@/app/adminaccount/marketing/AudienceCommunicationsTable';
import { Separator } from '@/components/ui/separator';

import { EnrichPartnerButton } from '@/app/adminaccount/marketing/EnrichPartnerButton';
import { PartnerOversightDialog } from '@/app/adminaccount/marketing/PartnerOversightDialog';
import { AddCommunicationLogDialog } from '@/app/adminaccount/marketing/AddCommunicationLogDialog';
import { CommunicationLogDialog } from '@/app/adminaccount/marketing/CommunicationLogDialog';

export default function SuppliersContent() {
    const { toast } = useToast();
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [view, setView] = useState<'list' | 'wizard'>('list');
    const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [supplierToDelete, setSupplierToDelete] = useState<any | null>(null);

    const forceRefresh = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            const result = await fetchFromAdminAPI(token, 'getLendingData', { collectionName: 'lendingSuppliers' });
            setSuppliers(result.data || []);
        } catch (e: any) {
            setError(e.message);
            toast({ variant: 'destructive', title: 'Error loading suppliers', description: e.message });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);
    
    useEffect(() => {
        forceRefresh();
    }, [forceRefresh]);

    const handleEdit = (supplier: any) => {
        setSelectedSupplier(supplier);
        setView('wizard');
    };

    const handleAddNew = () => {
        setSelectedSupplier(null);
        setView('wizard');
    };
    
    const handleBackToList = () => {
        setView('list');
        setSelectedSupplier(null);
    };

    const handleSaveSuccess = () => {
        forceRefresh();
        handleBackToList();
    };

    const handleDelete = async () => {
        if (!supplierToDelete) return;
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            await fetchFromAdminAPI(token, 'deleteLendingPartner', { collection: 'lendingSuppliers', partnerId: supplierToDelete.id });
            toast({ title: 'Supplier Deleted' });
            forceRefresh();
            setSupplierToDelete(null);
            setIsDeleteAlertOpen(false);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
        }
    };

    const columns: ColumnDef<any>[] = useMemo(() => [
        { 
            accessorKey: 'name', 
            header: 'Supplier Entity',
            cell: ({row}) => (
                <div className="flex flex-col text-left">
                    <span className="font-bold text-foreground text-left">{row.original.name}</span>
                    <div className="flex items-center gap-1.5 mt-0.5 text-left">
                        <Badge variant="outline" className="text-[8px] h-3.5 uppercase font-black border-primary/20 text-primary">Dealer Node</Badge>
                        <span className="text-[9px] text-muted-foreground font-mono uppercase text-left">{row.original.id.slice(-6)}</span>
                    </div>
                </div>
            )
        },
        { 
            header: 'Specialization', 
            cell: ({row}) => (
                <div className="flex flex-wrap gap-1 text-left">
                    {(row.original.industrial_tags || []).slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-[8px] h-3.5 uppercase font-black px-1.5">{tag}</Badge>
                    ))}
                    {!row.original.industrial_tags?.length && <span className="text-[10px] text-muted-foreground italic">General</span>}
                </div>
            )
        },
        { 
            accessorKey: 'status', 
            header: 'Status', 
            cell: ({ row }) => (
                <Badge variant={row.original.status === 'active' ? 'default' : 'outline'} className="capitalize text-[10px] font-black text-left">
                    {row.original.status}
                </Badge>
            )
        },
        { id: 'actions', header: <div className="text-right">Audit</div>, cell: ({ row }) => (
            <div className="flex justify-end items-center gap-1 text-left">
                <EnrichPartnerButton partner={row.original} onUpdate={forceRefresh} />
                <AddCommunicationLogDialog partnerId={row.original.id} collection="lendingSuppliers" onLogAdded={forceRefresh} />
                <CommunicationLogDialog partnerId={row.original.id} partnerName={row.original.name} />
                <PartnerOversightDialog partner={row.original} onUpdate={forceRefresh} />
                
                <Separator orientation="vertical" className="h-4 mx-1" />
                
                <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original)} title="Edit Record"><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => { setSupplierToDelete(row.original); setIsDeleteAlertOpen(true); }} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
        ) },
    ], [forceRefresh]);
    
    if (view === 'wizard') {
        return <EditClientWizard client={selectedSupplier} targetCollection="lendingSuppliers" onSave={handleSaveSuccess} onBack={handleBackToList} />;
    }

    return (
        <div className="space-y-8 text-left text-foreground">
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent className="text-left text-foreground">
                    <AlertDialogHeader className="text-left text-foreground">
                        <AlertDialogTitle className="text-left">Expunge Supplier Record?</AlertDialogTitle>
                        <AlertDialogDescription className="text-left">Permanent removal of "{supplierToDelete?.name}" from the dealership registry.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="text-left text-foreground text-left">
                        <AlertDialogCancel onClick={() => setSupplierToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>Confirm Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 text-left text-foreground">
                <div className="text-left">
                    <h1 className="text-3xl font-black font-headline tracking-tight flex items-center gap-3 text-left">
                        <ShoppingBag className="h-8 w-8 text-primary" />
                        Supplier Registry
                    </h1>
                    <p className="text-muted-foreground mt-1 text-left">Dealerships and equipment manufacturers authorized for platform acquisitions.</p>
                </div>
            </div>

            <Card className="border-none shadow-xl bg-white text-left text-foreground">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10 text-left p-6 text-foreground text-foreground">
                    <div className="text-left text-foreground text-left text-foreground">
                        <CardTitle className="text-lg font-bold text-left text-foreground">Authorized Suppliers</CardTitle>
                        <CardDescription className="text-left text-foreground">Entities approved to supply assets for financing.</CardDescription>
                    </div>
                    <div className="flex gap-2 text-left">
                        <Button variant="outline" size="sm" onClick={forceRefresh} disabled={isLoading} className="gap-2 text-foreground">
                            <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} /> Sync Registry
                        </Button>
                        <Button onClick={handleAddNew} size="sm" className="gap-2 font-bold text-white shadow-lg">
                            <PlusCircle className="h-4 w-4" /> Add Supplier
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 text-left text-foreground text-foreground">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground text-center">Synchronizing Ledger...</p>
                        </div>
                    ) : (
                        <DataTable columns={columns} data={suppliers} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}