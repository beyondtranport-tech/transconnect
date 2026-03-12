
'use client';

import { Suspense, useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { getClientSideAuthToken, useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { Loader2, ArrowLeft, Users, FileText, Briefcase } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { AgreementActionMenu } from '@/app/lending/agreements/AgreementActionMenu';
import { formatCurrency, formatDateSafe } from '@/lib/utils';

function ClientDetailPage() {
    const params = useParams();
    const router = useRouter();
    const clientId = params.clientId as string;
    const firestore = useFirestore();

    const clientRef = useMemoFirebase(() => {
        if (!firestore || !clientId) return null;
        return doc(firestore, `lendingClients/${clientId}`);
    }, [firestore, clientId]);
    const { data: client, isLoading: isClientLoading, error: clientError } = useDoc(clientRef);

    const agreementsQuery = useMemoFirebase(() => {
        if (!firestore || !clientId) return null;
        return query(collection(firestore, `lendingClients/${clientId}/agreements`));
    }, [firestore, clientId]);
    const { data: agreements, isLoading: areAgreementsLoading, forceRefresh: refreshAgreements } = useCollection(agreementsQuery);
    
    const assetsQuery = useMemoFirebase(() => {
        if (!firestore || !clientId) return null;
        return query(collection(firestore, 'lendingAssets'), where('clientId', '==', clientId));
    }, [firestore, clientId]);
    const { data: assets, isLoading: areAssetsLoading } = useCollection(assetsQuery);
    
    const agreementColumns: ColumnDef<any>[] = useMemo(() => [
        { accessorKey: 'id', header: 'Agreement ID' },
        { accessorKey: 'type', header: 'Type' },
        { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge>{row.original.status}</Badge> },
        { accessorKey: 'totalAdvanced', header: 'Amount', cell: ({ row }) => formatCurrency(row.original.totalAdvanced) },
        { id: 'actions', header: 'Actions', cell: ({ row }) => <AgreementActionMenu agreement={row.original} onUpdate={refreshAgreements} /> },
    ], [refreshAgreements]);

    const assetColumns: ColumnDef<any>[] = useMemo(() => [
        { accessorKey: 'make', header: 'Make' },
        { accessorKey: 'model', header: 'Model' },
        { accessorKey: 'year', header: 'Year' },
        { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge>{row.original.status}</Badge> },
    ], []);


    if (isClientLoading) {
        return <div className="flex justify-center items-center h-full py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }
    
    if (clientError) {
        return <div className="text-center py-20 text-destructive">Error: {clientError.message}</div>
    }
    
    if (!client) {
        return <div className="text-center py-20 text-muted-foreground">Client not found.</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <CardHeader className="p-0">
                    <CardTitle className="text-3xl font-bold flex items-center gap-3">
                        <Users className="h-8 w-8 text-primary"/>
                        {client.name}
                    </CardTitle>
                    <CardDescription>Client Overview</CardDescription>
                </CardHeader>
                <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Client List</Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText /> Agreements</CardTitle>
                </CardHeader>
                <CardContent>
                    {areAgreementsLoading ? <Loader2 className="animate-spin" /> : <DataTable columns={agreementColumns} data={agreements || []} />}
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Briefcase /> Assets</CardTitle>
                </CardHeader>
                <CardContent>
                    {areAssetsLoading ? <Loader2 className="animate-spin" /> : <DataTable columns={assetColumns} data={assets || []} />}
                </CardContent>
            </Card>
        </div>
    );
}

export default function Page() {
    return (
        <div className="container mx-auto px-4 py-16">
            <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-16 w-16 animate-spin" /></div>}>
                <ClientDetailPage />
            </Suspense>
        </div>
    );
}
