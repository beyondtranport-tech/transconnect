'use client';

import { Suspense, useMemo } from 'react';
import { notFound, useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { Loader2, User, ArrowLeft, Building, Mail, Phone, Hash, Globe, Banknote, FileSignature, Truck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';

function ClientDetailComponent() {
    const params = useParams();
    const clientId = params.clientId as string;
    const firestore = useFirestore();

    const clientRef = useMemoFirebase(() => {
        if (!firestore || !clientId) return null;
        return doc(firestore, `lendingClients/${clientId}`);
    }, [firestore, clientId]);
    const { data: client, isLoading: isLoadingClient, error: clientError } = useDoc(clientRef);
    
    // Fetch related data
    const agreementsQuery = useMemoFirebase(() => firestore && clientId ? query(collection(firestore, `lendingClients/${clientId}/agreements`)) : null, [firestore, clientId]);
    const { data: agreements } = useCollection(agreementsQuery);

    const facilitiesQuery = useMemoFirebase(() => firestore && clientId ? query(collection(firestore, `lendingClients/${clientId}/facilities`)) : null, [firestore, clientId]);
    const { data: facilities } = useCollection(facilitiesQuery);
    
    const assetsQuery = useMemoFirebase(() => firestore && clientId ? query(collection(firestore, 'lendingAssets'), where('clientId', '==', clientId)) : null, [firestore, clientId]);
    const { data: assets } = useCollection(assetsQuery);


    if (isLoadingClient) {
        return <div className="flex justify-center items-center h-full py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }
    
    if (clientError) {
        return <div className="text-center py-20 text-destructive">Error: {clientError.message}</div>;
    }
    
    if (!client) {
        return notFound();
    }

    const agreementsColumns: ColumnDef<any>[] = [
        { accessorKey: 'description', header: 'Description' },
        { accessorKey: 'status', header: 'Status', cell: ({row}) => <Badge className="capitalize">{row.original.status}</Badge> },
        { accessorKey: 'totalAdvanced', header: 'Amount', cell: ({row}) => formatCurrency(row.original.totalAdvanced) },
    ];
    
    const facilitiesColumns: ColumnDef<any>[] = [
        { accessorKey: 'type', header: 'Type', cell: ({row}) => <span className="capitalize">{row.original.type}</span> },
        { accessorKey: 'limit', header: 'Limit', cell: ({row}) => formatCurrency(row.original.limit) },
        { accessorKey: 'status', header: 'Status', cell: ({row}) => <Badge className="capitalize">{row.original.status}</Badge> },
    ];
    
     const assetsColumns: ColumnDef<any>[] = [
        { accessorKey: 'make', header: 'Asset', cell: ({row}) => `${row.original.year} ${row.original.make} ${row.original.model}` },
        { accessorKey: 'costOfSale', header: 'Cost', cell: ({row}) => formatCurrency(row.original.costOfSale) },
        { accessorKey: 'status', header: 'Status', cell: ({row}) => <Badge className="capitalize">{row.original.status}</Badge> },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg"><User className="h-8 w-8 text-primary"/></div>
                    <div>
                        <h1 className="text-2xl font-bold">{client.name}</h1>
                        <p className="text-muted-foreground">{client.type} / {client.category}</p>
                    </div>
                </div>
                <Button variant="outline" asChild><Link href="/lending?view=clients"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Clients</Link></Button>
            </div>

            <Card>
                <CardHeader><CardTitle>Client Information</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-muted-foreground"/><span>{client.email || 'N/A'}</span></div>
                    <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-muted-foreground"/><span>{client.cell || 'N/A'}</span></div>
                    <div className="flex items-center gap-3"><Hash className="h-5 w-5 text-muted-foreground"/><span>{client.code || 'N/A'}</span></div>
                </CardContent>
            </Card>

            <Tabs defaultValue="agreements">
                <TabsList>
                    <TabsTrigger value="agreements"><FileSignature className="mr-2"/>Agreements</TabsTrigger>
                    <TabsTrigger value="facilities"><Banknote className="mr-2"/>Facilities</TabsTrigger>
                    <TabsTrigger value="assets"><Truck className="mr-2"/>Assets</TabsTrigger>
                </TabsList>
                <TabsContent value="agreements" className="mt-4">
                    <Card><CardHeader><CardTitle>Lending Agreements</CardTitle></CardHeader><CardContent><DataTable columns={agreementsColumns} data={agreements || []} /></CardContent></Card>
                </TabsContent>
                <TabsContent value="facilities" className="mt-4">
                    <Card><CardHeader><CardTitle>Credit Facilities</CardTitle></CardHeader><CardContent><DataTable columns={facilitiesColumns} data={facilities || []} /></CardContent></Card>
                </TabsContent>
                 <TabsContent value="assets" className="mt-4">
                    <Card><CardHeader><CardTitle>Linked Assets</CardTitle></CardHeader><CardContent><DataTable columns={assetsColumns} data={assets || []} /></CardContent></Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function ClientDetailPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <ClientDetailComponent />
        </Suspense>
    );
}
