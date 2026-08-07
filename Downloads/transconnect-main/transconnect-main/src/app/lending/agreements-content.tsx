'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PlusCircle, FileSignature, Edit, Eye, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { getClientSideAuthToken } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import { AgreementWizard } from './edit-agreement';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

export function AgreementsContent() {
    const [view, setView] = useState<'list' | 'wizard'>('list');
    const [agreements, setAgreements] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [facilities, setFacilities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    
    const [selectedAgreement, setSelectedAgreement] = useState<any | null>(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [agreementToDelete, setAgreementToDelete] = useState<any | null>(null);

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
        setView('list');
        setSelectedAgreement(null);
    };

    const handleSaveSuccess = () => {
        forceRefresh();
        setView('list');
        setSelectedAgreement(null);
    };
    
    const handleDelete = async () => {
        if (!agreementToDelete) return;
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            await performAdminAction(token, 'deleteLendingAgreement', { 
                clientId: agreementToDelete.clientId, 
                agreementId: agreementToDelete.id 
            });
            toast({ title: 'Agreement Deleted' });
            forceRefresh();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
        } finally {
            setAgreementToDelete(null);
            setIsDeleteAlertOpen(false);
        }
    };

    if (error) {
        return <Card className="bg-destructive/10 border-destructive text-destructive-foreground"><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent>{error}</CardContent></Card>
    }

    const facilityProtocolVisibleFor = ['Installment Sale', 'Lease / Rental'];

    if (view === 'wizard') {
        return (
            <AgreementWizard
                agreement={selectedAgreement}
                clients={clients}
                facilities={facilities}
                onSave={handleSaveSuccess}
                onBack={handleBackToList}
                facilityProtocolVisibleFor={facilityProtocolVisibleFor}
            />
        );
    }

    return (
        <>
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete agreement "{agreementToDelete?.description}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setAgreementToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>Yes, delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
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
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {agreements.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No agreements found.</TableCell>
                                        </TableRow>
                                    ) : (
                                        agreements.map((agreement) => (
                                            <TableRow key={agreement.id}>
                                                <TableCell className="font-semibold">
                                                    <Link href={`/lending/clients/${agreement.clientId}`} className="text-primary hover:underline">
                                                        {clientMap.get(agreement.clientId) || 'Unknown Client'}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>{agreement.description}</TableCell>
                                                <TableCell className="font-bold">{formatCurrency(agreement.totalAdvanced)}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize">{agreement.type?.replace(/-/g, ' ')}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={statusColors[agreement.status] || 'secondary'} className="capitalize">
                                                        {agreement.status?.replace(/_/g, ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{formatDateSafe(agreement.createDate)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end items-center gap-1">
                                                        <Button asChild variant="ghost" size="icon">
                                                            <Link href={`/lending/clients/${agreement.clientId}`}>
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(agreement)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => { setAgreementToDelete(agreement); setIsDeleteAlertOpen(true); }}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
}

export default AgreementsContent;