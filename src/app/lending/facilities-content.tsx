'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PlusCircle, Banknote, Edit, Trash2, CheckCircle, XCircle, MoreVertical, Ban, Users, Building, ArrowRight, ShieldCheck, Scale, Landmark, RefreshCcw } from "lucide-react";
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { getClientSideAuthToken } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, cn } from '@/lib/utils';
import { EditFacilityWizard } from './edit-facility';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useRouter, useSearchParams } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

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
    const [debtors, setDebtors] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [view, setView] = useState<'list' | 'wizard'>('list');
    const [selectedFacility, setSelectedFacility] = useState<any | null>(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [facilityToDelete, setFacilityToDelete] = useState<any | null>(null);

    const [statusChangeAlert, setStatusChangeAlert] = useState<{ open: boolean; facility: any; newStatus: 'active' | 'inactive' | 'pending' | null }>({ open: false, facility: null, newStatus: null });

    const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);
    const debtorMap = useMemo(() => new Map(debtors.map(d => [d.id, d.name])), [debtors]);

    const forceRefresh = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            
            const [facilitiesRes, clientsRes, debtorsRes] = await Promise.all([
                performAdminAction(token, 'getLendingData', { collectionName: 'facilities' }),
                performAdminAction(token, 'getLendingData', { collectionName: 'lendingClients' }),
                performAdminAction(token, 'getLendingData', { collectionName: 'lendingDebtors' })
            ]);
            
            setFacilities(facilitiesRes.data || []);
            setClients(clientsRes.data || []);
            setDebtors(debtorsRes.data || []);

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

    const processStatusChange = async () => {
        const { facility, newStatus } = statusChangeAlert;
        if (!facility || !newStatus) return;

        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            
            await performAdminAction(token, 'updateFacilityStatus', {
                facilityId: facility.id,
                status: newStatus
            });
            
            toast({ title: `Status Updated`, description: `Facility status set to ${newStatus}.` });
            forceRefresh();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: e.message });
        } finally {
            setStatusChangeAlert({ open: false, facility: null, newStatus: null });
        }
    };
    
    const handleDelete = async () => {
        if (!facilityToDelete) return;
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            await performAdminAction(token, 'deleteLendingFacility', { 
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
        { 
            header: 'Authority Node', 
            cell: ({ row }) => {
                const ownerType = row.original.ownerType || 'client';
                const ownerId = ownerType === 'client' ? row.original.clientId : row.original.debtorId;
                const name = ownerType === 'client' ? clientMap.get(ownerId) : debtorMap.get(ownerId);
                return (
                    <div className="flex flex-col text-left">
                        <span className="font-bold text-foreground text-left">{name || 'Unknown Entity'}</span>
                        <Badge variant="outline" className="w-fit text-[8px] h-3.5 mt-1 uppercase font-black">
                            {ownerType} Registry
                        </Badge>
                    </div>
                );
            }
        },
        { 
            header: 'Protocol Type',
            cell: ({ row }) => {
                const isGlobal = row.original.facilityClass === 'global';
                return (
                    <div className="flex flex-col text-left">
                        <Badge className={cn("capitalize text-[9px] font-black tracking-widest w-fit", isGlobal ? "bg-slate-900 text-white" : "bg-primary/10 text-primary")}>
                            {isGlobal ? 'Global Ceiling' : 'Sub Limit'}
                        </Badge>
                        {row.original.ownerType === 'client' && row.original.agreementType && (
                            <span className="text-[10px] font-bold text-slate-600 mt-1 uppercase tracking-tight">Product: {row.original.agreementType}</span>
                        )}
                        {row.original.ownerType === 'debtor' && row.original.associatedClientId && (
                            <div className="flex items-center gap-1.5 mt-1 text-left">
                                <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                                <span className="text-[10px] font-bold text-slate-600 text-left">Member: {clientMap.get(row.original.associatedClientId)}</span>
                            </div>
                        )}
                    </div>
                );
            }
        },
        { accessorKey: 'type', header: 'Lending Group', cell: ({row}) => <Badge variant="outline" className="capitalize text-[10px] font-bold">{row.original.type?.replace(/_/g, ' ')}</Badge> },
        { accessorKey: 'limit', header: 'Authorized Limit', cell: ({ row }) => <span className="font-black text-foreground">{formatCurrency(row.original.limit)}</span> },
        { accessorKey: 'status', header: 'Standing', cell: ({row}) => <Badge variant={statusColors[row.original.status] || 'secondary'} className="capitalize text-[10px] font-black tracking-widest">{row.original.status || 'Active'}</Badge> },
        { id: 'actions', header: <div className="text-right">Audit</div>, cell: ({ row }) => (
            <div className="text-right">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="text-left">
                        <DropdownMenuItem onClick={() => handleEdit(row.original)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Parameters
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => setStatusChangeAlert({ open: true, facility: row.original, newStatus: 'active' })}
                            disabled={row.original.status === 'active'}
                        >
                            <CheckCircle className="mr-2 h-4 w-4" /> Set Active
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setStatusChangeAlert({ open: true, facility: row.original, newStatus: 'inactive' })}
                            disabled={row.original.status === 'inactive'}
                        >
                            <XCircle className="mr-2 h-4 w-4" /> Set Inactive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive"
                            onSelect={() => { setFacilityToDelete(row.original); setIsDeleteAlertOpen(true); }}
                        >
                            <Trash2 className="mr-2 h-4 w-4" /> Expunge Node
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        )},
    ], [clientMap, debtorMap]);
    
    if (error) {
        return <Card className="bg-destructive/10 border-destructive text-destructive-foreground"><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent>{error}</CardContent></Card>
    }
    
    if (view === 'wizard') {
        return <EditFacilityWizard facility={selectedFacility} clients={clients} debtors={debtors} onSave={handleSaveSuccess} onBack={handleBackToList} />;
    }

    return (
        <div className="space-y-8 text-left text-foreground">
             <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent className="text-left text-foreground">
                    <AlertDialogHeader className="text-left">
                        <AlertDialogTitle className="text-left">Expunge Facility Node?</AlertDialogTitle>
                        <AlertDialogDescription className="text-left">Permanent removal from the institutional ledger. This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="text-left">
                        <AlertDialogCancel onClick={() => setFacilityToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>Confirm Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={statusChangeAlert.open} onOpenChange={(open) => !open && setStatusChangeAlert({ open: false, facility: null, newStatus: null })}>
                <AlertDialogContent className="text-left text-foreground">
                     <AlertDialogHeader className="text-left">
                        <AlertDialogTitle className="text-left">Update Authority Node</AlertDialogTitle>
                        <AlertDialogDescription className="text-left">
                            Confirm status change to <span className="font-bold capitalize">{statusChangeAlert.newStatus}</span> for this facility.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={processStatusChange}>Confirm Change</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 text-left text-foreground">
                <div className="text-left text-foreground">
                    <h1 className="text-3xl font-black font-headline tracking-tight flex items-center gap-3 text-left text-foreground">
                        <Banknote className="h-8 w-8 text-primary" />
                        Facility Ledger
                    </h1>
                    <p className="text-muted-foreground mt-1 text-left">Strategic oversight of authorized credit boundaries for borrowing members and cessionary nodes.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={forceRefresh} disabled={isLoading} className="gap-2 text-foreground">
                        <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} /> Sync Matrix
                    </Button>
                    <Button onClick={handleAddNew} className="gap-2 font-bold text-white shadow-lg">
                        <PlusCircle className="h-4 w-4"/> Initialize Facility
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-xl bg-white text-left text-foreground">
                <CardContent className="pt-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground text-center">Synchronizing Ledger...</p>
                        </div>
                    ) : (
                        <DataTable columns={columns} data={facilities} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
