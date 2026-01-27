'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Store, CheckCircle, Eye, Handshake } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getClientSideAuthToken } from '@/firebase';
import { ShopPreview } from '@/components/shop-preview';
import MemberCommercials from './wallet/[memberId]/member-commercials';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnDef } from '@/hooks/use-data-table';
import * as React from 'react';

// --- Interfaces & Helper Functions ---
interface Shop {
    id: string;
    shopName: string;
    ownerId: string;
    companyId: string;
    category: string;
    status: 'draft' | 'pending_review' | 'approved' | 'rejected';
    createdAt: string;
    [key: string]: any;
}

interface PendingAgreement {
    id: string;
    shopId: string;
    companyId: string;
    shopName?: string;
    percentage: number;
    effectiveDate: string;
    createdAt: string; 
    [key: string]: any;
}

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  draft: 'secondary',
  pending_review: 'outline',
  approved: 'default',
  rejected: 'destructive',
};

const formatDate = (isoString: string | undefined) => {
    if (!isoString) return 'N/A';
    try {
        const date = typeof isoString === 'string' ? new Date(isoString) : (isoString as any).toDate();
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleString('en-ZA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'});
    } catch (e) {
        return 'Invalid Date';
    }
};

// --- Dialog Components ---
function ShopPreviewDialog({ shop }: { shop: Shop }) {
    const [products, setProducts] = useState<any[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen && products.length === 0) {
            setIsLoadingProducts(true);
            getClientSideAuthToken().then(token => {
                 fetch('/api/getUserSubcollection', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: `shops/${shop.id}/products`, type: 'collection' }),
                })
                .then(res => res.json())
                .then(result => {
                    if (result.success) setProducts(result.data || []);
                })
                .finally(() => setIsLoadingProducts(false));
            })
        }
    };
    
    return (
        <Dialog onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm"><Eye className="mr-2 h-4 w-4" /> Preview</Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl h-[90vh] p-0 border-0">
                 <DialogHeader className="sr-only">
                    <DialogTitle>Shop Preview: {shop.shopName}</DialogTitle>
                    <DialogDescription>A preview of the shop as it will appear to customers.</DialogDescription>
                </DialogHeader>
                <div className="w-full h-full overflow-y-auto">
                     {isLoadingProducts ? (
                        <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin h-10 w-10" /></div>
                     ) : (
                        <ShopPreview shop={shop} products={products} />
                     )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

function ShopCommercialsDialog({ shop, onUpdate }: { shop: any; onUpdate: () => void }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Handshake className="mr-2 h-4 w-4" /> Review
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <MemberCommercials companyId={shop.companyId} shopId={shop.shopId || shop.id} onUpdate={onUpdate} />
      </DialogContent>
    </Dialog>
  );
}

// --- Main Component ---
export default function ShopsList() {
    const { toast } = useToast();
    const [isApproving, setIsApproving] = useState<string | null>(null);
    const [pendingShops, setPendingShops] = useState<Shop[]>([]);
    const [proposedAgreements, setProposedAgreements] = useState<PendingAgreement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            const response = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getDashboardQueues' }),
            });

            const result = await response.json();
            if (!result.success) throw new Error(result.error || 'Failed to load queues.');
            
            setPendingShops(result.data.pendingShops || []);
            setProposedAgreements(result.data.proposedAgreements || []);

        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);


    const handleApprove = async (shop: Shop) => {
        setIsApproving(shop.id);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error('Authentication failed.');

            const response = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'approveShop', payload: { shopId: shop.id, companyId: shop.companyId } })
            });

             const result = await response.json();
             if (!response.ok) throw new Error(result.error || 'Failed to approve shop.');
            
            toast({ title: 'Shop Approved!', description: 'The shop is now public and live on the platform.' });
            loadData();
        } catch (e: any) {
             toast({ variant: 'destructive', title: 'Approval Failed', description: e.message || 'An unexpected error occurred.' });
        }
        setIsApproving(null);
    };

    const shopColumns: ColumnDef<Shop>[] = useMemo(() => [
        { accessorKey: 'createdAt', header: 'Submitted', cell: ({row}) => formatDate(row.original.createdAt) },
        { accessorKey: 'shopName', header: 'Shop Name', cell: ({row}) => <div>{row.original.shopName}</div> },
        { accessorKey: 'category', header: 'Category', cell: ({row}) => <div>{row.original.category}</div> },
        { accessorKey: 'companyId', header: 'Company ID', cell: ({row}) => <span className="font-mono text-xs">{row.original.companyId}</span> },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="text-right space-x-2">
                    <ShopPreviewDialog shop={row.original} />
                    <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleApprove(row.original)}
                        disabled={isApproving === row.original.id}
                    >
                        {isApproving === row.original.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        Approve Shop
                    </Button>
                </div>
            )
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [isApproving]);

    const agreementColumns: ColumnDef<PendingAgreement>[] = useMemo(() => [
        { accessorKey: 'shopName', header: 'Shop Name', cell: ({row}) => <div>{row.original.shopName}</div> },
        { 
            accessorKey: 'percentage', 
            header: 'Proposed Commission',
            cell: ({ row }) => <Badge variant="secondary">{row.original.percentage}%</Badge>
        },
        { 
            accessorKey: 'effectiveDate', 
            header: 'Effective Date',
            cell: ({ row }) => formatDate(row.original.effectiveDate)
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="text-right">
                    <ShopCommercialsDialog shop={row.original} onUpdate={loadData} />
                </div>
            ),
        }
    ], [loadData]);
    
    if (error) {
        return (
            <div className="text-destructive-foreground bg-destructive/90 p-4 rounded-md">
                <h4 className="font-semibold">Error loading data</h4>
                <p className="text-sm">{error}</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Store /> New Shop Approval Queue</CardTitle>
                    <CardDescription>Review and approve new member shops submitted for publication.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                    ) : pendingShops && pendingShops.length > 0 ? (
                        <DataTable columns={shopColumns} data={pendingShops} />
                    ) : (
                        <div className="text-center py-20 border-2 border-dashed rounded-lg">
                            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                            <h3 className="mt-4 text-xl font-semibold">All Clear!</h3>
                            <p className="mt-2 text-muted-foreground">There are no new shops currently awaiting approval.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Handshake /> Commercial Agreement Queue</CardTitle>
                    <CardDescription>Review and accept new commercial terms proposed by shop owners.</CardDescription>
                </CardHeader>
                <CardContent>
                     {isLoading ? (
                        <div className="flex justify-center items-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                     ) : proposedAgreements && proposedAgreements.length > 0 ? (
                        <DataTable columns={agreementColumns} data={proposedAgreements} />
                     ) : (
                        <div className="text-center py-20 border-2 border-dashed rounded-lg">
                            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                            <h3 className="mt-4 text-xl font-semibold">No Pending Agreements!</h3>
                            <p className="mt-2 text-muted-foreground">There are no new commercial terms awaiting acceptance.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}