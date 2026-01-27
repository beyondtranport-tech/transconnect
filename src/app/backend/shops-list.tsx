
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Store, CheckCircle, Eye, Hammer, RefreshCcw, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getClientSideAuthToken } from '@/firebase';
import { ShopPreview } from '@/components/shop-preview';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnDef } from '@/hooks/use-data-table';
import * as React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


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

async function fetchFromAdminAPI(token: string, action: string, payload?: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, payload }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error for action: ${action}`);
    }
    return result;
}


// --- Dialog Component ---
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
                    body: JSON.stringify({ path: `companies/${shop.companyId}/shops/${shop.id}/products`, type: 'collection' }),
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
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Eye className="mr-2 h-4 w-4" /> Preview
                </DropdownMenuItem>
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

function ShopActionMenu({ shop, onUpdate }: { shop: Shop, onUpdate: () => void }) {
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [actionToConfirm, setActionToConfirm] = useState<'approve' | 'reject' | null>(null);

    const handleAction = async () => {
        if (!actionToConfirm) return;

        setIsProcessing(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error('Authentication failed.');

            const payload = { shopId: shop.id, companyId: shop.companyId };
            let toastTitle = '';
            let toastDescription = '';

            await fetchFromAdminAPI(token, actionToConfirm === 'approve' ? 'approveShop' : 'rejectShop', payload);

            if (actionToConfirm === 'approve') {
                toastTitle = shop.status === 'approved' ? 'Shop Synced' : 'Shop Approved!';
                toastDescription = shop.status === 'approved' ? 'The products have been re-published.' : 'The shop is now public.';
            } else {
                toastTitle = 'Shop Rejected';
                toastDescription = 'The shop has been marked as rejected.';
            }
            
            toast({ title: toastTitle, description: toastDescription });
            onUpdate();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Action Failed', description: e.message });
        } finally {
            setIsProcessing(false);
            setIsAlertOpen(false);
        }
    };
    
    return (
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreVertical className="h-4 w-4"/>}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <ShopPreviewDialog shop={shop} />
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setActionToConfirm('approve')}>
                        <CheckCircle className="mr-2 h-4 w-4" /> Approve / Sync
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => setActionToConfirm('reject')}>
                        <XCircle className="mr-2 h-4 w-4" /> Reject
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
             <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {actionToConfirm === 'approve' ? `This will approve the shop and make it public. If already approved, it will re-sync all products.` : `This will reject the shop submission and remove it from public view.`}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleAction} variant={actionToConfirm === 'reject' ? 'destructive' : 'default'}>
                        Yes, Continue
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// --- Main Component ---
export default function ShopsList() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            const result = await fetchFromAdminAPI(token, 'getShops');
            setShops(result.data || []);
        } catch(e: any) {
            setError(e.message)
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);


    const columns: ColumnDef<Shop>[] = useMemo(() => [
        { accessorKey: 'shopName', header: 'Shop Name' },
        { accessorKey: 'category', header: 'Category' },
        { 
          accessorKey: 'status', 
          header: 'Status',
          cell: ({ row }) => <Badge variant={statusColors[row.original.status] || 'secondary'} className="capitalize">{row.original.status?.replace(/_/g, ' ')}</Badge>
        },
        { accessorKey: 'createdAt', header: 'Date', cell: ({row}) => formatDate(row.original.createdAt) },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => <ShopActionMenu shop={row.original} onUpdate={loadData} />
        }
    ], [loadData]);
    
    if (error) {
        return (
            <div className="text-destructive-foreground bg-destructive/90 p-4 rounded-md">
                <h4 className="font-semibold">Error loading data</h4>
                <p className="text-sm">{error}</p>
                 <Button onClick={loadData} variant="destructive" className="mt-2">Try Again</Button>
            </div>
        );
    }
    
    return (
        <Card>
            <CardHeader className="flex-row justify-between items-start">
                 <div>
                    <CardTitle className="flex items-center gap-2"><Store /> All Shops</CardTitle>
                    <CardDescription>Review and manage all shops on the platform.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
                    <RefreshCcw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
                    Refresh
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                ) : (
                    <DataTable columns={columns} data={shops} />
                )}
            </CardContent>
        </Card>
    );
}
