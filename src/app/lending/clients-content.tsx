'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { Loader2, PlusCircle, Users, Edit, Trash2, Eye, Database, SearchCode, History, RotateCcw, Download, Upload, Zap, Search, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { EditClientWizard } from './edit-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DebtorDiscoveryEngine from './debtor-discovery';
import { BulkImportDialog } from '@/app/adminaccount/marketing/BulkImportDialog';
import { cn, downloadDataAsCSV, formatDateSafe } from '@/lib/utils';
import AudienceCommunicationsTable from '@/app/adminaccount/marketing/AudienceCommunicationsTable';

// Forensic AI Tool Imports
import { EnrichPartnerButton } from '@/app/adminaccount/marketing/EnrichPartnerButton';
import { DeepPersonalizationButton } from '@/app/adminaccount/marketing/DeepPersonalizationButton';
import { PartnerOversightDialog } from '@/app/adminaccount/marketing/PartnerOversightDialog';
import { AddCommunicationLogDialog } from '@/app/adminaccount/marketing/AddCommunicationLogDialog';
import { CommunicationLogDialog } from '@/app/adminaccount/marketing/CommunicationLogDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// API Helper
async function performAdminAction(token: string, action: string, payload: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
        cache: 'no-store'
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error for action: ${action}`);
    }
    return result;
}

export default function ClientsContent() {
    const { toast } = useToast();
    const [clients, setClients] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [view, setView] = useState<'list' | 'wizard'>('list');
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
        setView('wizard');
    };

    const handleAddNew = () => {
        setSelectedClient(null);
        setView('wizard');
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
        { 
            accessorKey: 'name', 
            header: 'Client / Debtor',
            cell: ({row}) => (
                <div className="flex flex-col text-left">
                    <span className="font-bold text-foreground text-left">{row.original.name}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="outline" className="text-[8px] h-3.5 border-primary/20 text-primary uppercase font-black">Node Verified</Badge>
                        <span className="text-[9px] text-muted-foreground font-mono uppercase text-left">{row.original.code || row.original.id}</span>
                    </div>
                </div>
            )
        },
        { 
            header: 'Data Fidelity', 
            cell: ({row}) => (
                <div className="flex items-center gap-1.5">
                    {row.original.website ? <Globe className="h-3.5 w-3.5 text-primary" /> : <Globe className="h-3.5 w-3.5 text-muted-foreground opacity-20" />}
                    {row.original.email ? <Zap className="h-3.5 w-3.5 text-amber-500 fill-current" /> : <Zap className="h-3.5 w-3.5 text-muted-foreground opacity-20" />}
                </div>
            )
        },
        { 
            accessorKey: 'status', 
            header: 'Status', 
            cell: ({ row }) => <Badge className="capitalize text-[10px] font-black">{row.original.status}</Badge>
        },
        { id: 'actions', header: <div className="text-right">Forensic Actions</div>, cell: ({ row }) => (
            <div className="flex justify-end items-center gap-1 text-left">
                {/* DEEP RESEARCH & PERSO TOOLS */}
                <EnrichPartnerButton partner={row.original} onUpdate={forceRefresh} />
                <DeepPersonalizationButton partner={row.original} audience="debtors" />
                <AddCommunicationLogDialog partnerId={row.original.id} collection="lendingClients" onLogAdded={forceRefresh} />
                <CommunicationLogDialog partnerId={row.original.id} partnerName={row.original.name} />
                <PartnerOversightDialog partner={row.original} onUpdate={forceRefresh} />
                
                <Separator orientation="vertical" className="h-4 mx-1" />
                
                <Button asChild variant="ghost" size="icon"><Link href={`/lending/clients/${row.original.id}`}><Eye className="h-4 w-4" /></Link></Button>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => { setClientToDelete(row.original); setIsDeleteAlertOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
        ) },
    ], [forceRefresh]);
    
    if (view === 'wizard') {
        return <EditClientWizard client={selectedClient} onSave={handleSaveSuccess} onBack={handleBackToList} />;
    }

    return (
        <div className="space-y-8 text-left text-foreground">
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent className="text-left">
                    <AlertDialogHeader className="text-left">
                        <AlertDialogTitle className="text-left">Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-left">This will permanently delete client "{clientToDelete?.name}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="text-left">
                        <AlertDialogCancel onClick={() => setClientToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 text-left">
                <div className="text-left text-foreground">
                    <h1 className="text-3xl font-black font-headline tracking-tight flex items-center gap-3 text-left">
                        <Users className="h-8 w-8 text-primary" />
                        Client & Debtor Portfolio
                    </h1>
                    <p className="text-muted-foreground mt-1 text-left">Manage active lending relationships and discover new high-fidelity debtor opportunities.</p>
                </div>
            </div>

            <Tabs defaultValue="registry" className="w-full text-left">
                <TabsList className="bg-muted/30 p-1 h-auto flex-wrap justify-start">
                    <TabsTrigger value="registry" className="gap-2 px-6 py-2.5 font-bold uppercase tracking-widest text-[10px]">
                        <Database className="h-3.5 w-3.5" /> Client Registry (CRM)
                    </TabsTrigger>
                    <TabsTrigger value="discovery" className="gap-2 px-6 py-2.5 font-bold uppercase tracking-widest text-[10px]">
                        <SearchCode className="h-3.5 w-3.5" /> Debtor Discovery (AI)
                    </TabsTrigger>
                    <TabsTrigger value="oversight" className="gap-2 px-6 py-2.5 font-bold uppercase tracking-widest text-[10px]">
                        <History className="h-3.5 w-3.5" /> Oversight Timeline
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="registry" className="mt-8 space-y-6 text-left text-foreground">
                    <Card className="border-none shadow-xl bg-white text-left">
                        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10 text-left p-6">
                            <div className="text-left">
                                <CardTitle className="text-lg font-bold text-left">Master Portfolio</CardTitle>
                                <CardDescription className="text-left text-foreground">Verified entities currently active in the lending system.</CardDescription>
                            </div>
                            <div className="flex gap-2 text-left">
                                <Button variant="outline" size="sm" onClick={forceRefresh} disabled={isLoading} className="gap-2">
                                    <RotateCcw className={cn("h-4 w-4", isLoading && "animate-spin")} /> Refresh
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => downloadDataAsCSV(clients, `debtors-registry-${Date.now()}.csv`)} className="gap-2">
                                    <Download className="h-4 w-4" /> Export
                                </Button>
                                <BulkImportDialog type="lendingClient" onComplete={forceRefresh}>
                                    <Button variant="outline" size="sm" className="gap-2"><Upload className="h-4 w-4" /> Import</Button>
                                </BulkImportDialog>
                                <Button onClick={handleAddNew} size="sm" className="gap-2 font-bold text-white shadow-lg">
                                    <PlusCircle className="h-4 w-4" /> Add Debtor
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 text-left">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground text-center">Opening Registry...</p>
                                </div>
                            ) : (
                                <DataTable columns={columns} data={clients} />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="discovery" className="mt-8 text-left text-foreground">
                    <DebtorDiscoveryEngine />
                </TabsContent>

                <TabsContent value="oversight" className="mt-8 text-left text-foreground">
                    <Card className="border-none shadow-xl bg-white text-left">
                        <CardHeader className="border-b bg-muted/10 text-left">
                            <CardTitle className="text-lg font-bold text-left">Engagement Audit Trail</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 text-left">
                            <AudienceCommunicationsTable audience="debtor" />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
