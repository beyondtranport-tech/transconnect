

'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useCollection, useFirestore, useUser, getClientSideAuthToken } from "@/firebase";
import { useMemoFirebase } from '@/hooks/use-memo-firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Loader2, PlusCircle, CheckCircle } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { ColumnDef } from '@/hooks/use-data-table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

function AdminAcceptAgreementButton({ agreement, shop, onUpdate }: { agreement: any, shop: any, onUpdate: () => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { user: adminUser } = useUser();

    const handleAccept = async () => {
        if (!adminUser) return;
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            
            await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'acceptCommercialAgreement',
                    payload: { companyId: shop.companyId, shopId: shop.id, agreementId: agreement.id, userId: adminUser.uid }
                })
            });

            toast({ title: "Agreement Accepted!", description: "The new commercial terms are now active." });
            onUpdate();
        } catch(e: any) {
            toast({ variant: 'destructive', title: 'Acceptance Failed', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (agreement.status !== 'proposed' || agreement.proposedBy === adminUser?.uid) {
        return null;
    }

    return (
        <Button size="sm" onClick={handleAccept} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Accept
        </Button>
    );
}

export default function MemberCommercials({ companyId, shopId, onUpdate }: { companyId: string, shopId: string, onUpdate?: () => void }) {
    const firestore = useFirestore();

    const agreementsQuery = useMemoFirebase(() => {
        if (!firestore || !companyId || !shopId) return null;
        return query(collection(firestore, `companies/${companyId}/shops/${shopId}/agreements`), orderBy('createdAt', 'desc'));
    }, [firestore, companyId, shopId]);

    const { data: agreements, isLoading, forceRefresh } = useCollection(agreementsQuery);
    
    const finalOnUpdate = onUpdate || forceRefresh;

    const columns: ColumnDef<any>[] = useMemo(() => [
        { accessorKey: 'percentage', header: 'Commission %', cell: ({row}) => <div>{row.original.percentage}%</div> },
        { accessorKey: 'status', header: 'Status', cell: ({row}) => <Badge variant={row.original.status === 'active' ? 'default' : row.original.status === 'proposed' ? 'secondary' : 'outline'} className="capitalize">{row.original.status}</Badge>},
        { accessorKey: 'effectiveDate', header: 'Effective Date', cell: ({row}) => <div>{format(new Date(row.original.effectiveDate), 'PPP')}</div>},
        { accessorKey: 'expiryDate', header: 'Expiry Date', cell: ({row}) => row.original.expiryDate ? <div>{format(new Date(row.original.expiryDate), 'PPP')}</div> : <span className="text-muted-foreground">N/A</span>},
        { accessorKey: 'volumeThreshold', header: 'Volume Threshold', cell: ({row}) => row.original.volumeThreshold ? <span>R{row.original.volumeThreshold.toLocaleString()}</span> : <span className="text-muted-foreground">N/A</span>},
        { id: 'actions', cell: ({row}) => <AdminAcceptAgreementButton agreement={row.original} shop={{id: shopId, companyId}} onUpdate={finalOnUpdate} /> },
    ], [shopId, companyId, finalOnUpdate]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Shop Commercial Agreements</CardTitle>
                <CardDescription>
                    Review and approve commercial agreements for this member's shop.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                    <DataTable columns={columns} data={agreements || []} />
                )}
            </CardContent>
        </Card>
    );
}
