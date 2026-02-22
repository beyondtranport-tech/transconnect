
'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, PlusCircle, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useMemoFirebase, getClientSideAuthToken } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import PartnerWizard from './partner-wizard';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return 'R 0';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
};

export default function PartnerDetails({ partnerType, initialAction }: { partnerType: 'Suppliers' | 'Vendors' | 'Associates' | 'Debtors', initialAction?: string | null }) {
    const [view, setView] = useState<'list' | 'create' | 'edit'>(initialAction === 'add' ? 'create' : 'list');
    const [selectedPartner, setSelectedPartner] = useState<any | null>(null);
    const firestore = useFirestore();
    const { toast } = useToast();

    const isDebtor = partnerType === 'Debtors';
    const collectionName = isDebtor ? 'lendingClients' : 'lendingPartners';
    const partnerTypeEnum = partnerType.slice(0, -1).toLowerCase();

    const partnersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        if (isDebtor) {
            return query(collection(firestore, collectionName));
        }
        return query(collection(firestore, collectionName), where('type', '==', partnerTypeEnum));
    }, [firestore, collectionName, isDebtor, partnerTypeEnum]);

    const { data: partners, isLoading, forceRefresh } = useCollection(partnersQuery);

    useEffect(() => {
        if (initialAction === 'add') {
            setView('create');
        }
    }, [initialAction]);

    const handleEdit = useCallback((partner: any) => {
        setSelectedPartner(partner);
        setView('edit');
    }, []);
    
    const handleAdd = () => {
        setSelectedPartner(null);
        setView('create');
    };
    
    const handleBackToList = () => {
        setView('list');
        setSelectedPartner(null);
    };

    const handleSaveSuccess = () => {
        forceRefresh();
        handleBackToList();
    }
    
    const handleDelete = async (partnerId: string) => {
         try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            
            const response = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'deleteLendingPartner', payload: { partnerId: partnerId, collection: collectionName } }),
            });
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to delete partner.');
            
            toast({ title: 'Partner Deleted' });
            forceRefresh();
        } catch(e: any) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
        }
    }
    
    const columns: ColumnDef<any>[] = useMemo(() => [
        { 
            accessorKey: 'name', 
            header: `${partnerType.slice(0, -1)} Name`,
            cell: ({ row }) => <div>{row.original.name}</div>
        },
        { 
            accessorKey: 'status', 
            header: 'Status', 
            cell: ({row}) => <Badge className="capitalize">{row.original.status || 'Draft'}</Badge>
        },
        { 
            accessorKey: 'globalFacilityLimit', 
            header: 'Facility Limit', 
            cell: ({row}) => <span>{formatCurrency(row.original.globalFacilityLimit || 0)}</span> 
        },
        { 
            id: 'actions', 
            header: () => <div className="text-right">Actions</div>, 
            cell: ({ row }) => <div className="text-right"><Button variant="ghost" size="sm" onClick={() => handleEdit(row.original)}>Edit</Button></div> 
        }
    ], [handleEdit, partnerType]);


    if (view === 'create' || view === 'edit') {
        return <PartnerWizard partnerData={selectedPartner} partnerType={partnerType} onBack={handleBackToList} onSaveSuccess={handleSaveSuccess} />;
    }
    
    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-start">
                <div>
                    <CardTitle>Manage {partnerType}</CardTitle>
                </div>
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add {partnerType.slice(0,-1)}</Button>
            </CardHeader>
            <CardContent>
                 {isLoading ? (
                    <div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : (
                    <DataTable columns={columns} data={partners || []} />
                )}
            </CardContent>
        </Card>
    );
}
