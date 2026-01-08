'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Store, CheckCircle, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCollection, useFirestore, useMemoFirebase, getClientSideAuthToken } from '@/firebase';
import { collection, doc, query, collectionGroup } from 'firebase/firestore';
import { ShopPreview } from '@/components/shop-preview';

interface Shop {
    id: string;
    shopName: string;
    ownerId: string;
    companyId: string;
    category: string;
    status: 'draft' | 'pending_review' | 'approved' | 'rejected';
    createdAt: string;
    [key: string]: any; // Allow other properties
}

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  draft: 'secondary',
  pending_review: 'outline',
  approved: 'default',
  rejected: 'destructive',
};

function ShopPreviewDialog({ shop }: { shop: Shop }) {
    const firestore = useFirestore();
    
    const productsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, `companies/${shop.companyId}/shops/${shop.id}/products`));
    }, [firestore, shop.companyId, shop.id]);

    const { data: products, isLoading } = useCollection(productsCollection);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm"><Eye className="mr-2 h-4 w-4" /> Preview</Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl h-[90vh] p-0 border-0">
                 <DialogHeader className="sr-only">
                    <DialogTitle>Shop Preview: {shop.shopName}</DialogTitle>
                    <DialogDescription>A preview of the shop as it will appear to customers.</DialogDescription>
                </DialogHeader>
                <div className="w-full h-full overflow-y-auto">
                     {isLoading ? (
                        <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin h-10 w-10" /></div>
                     ) : (
                        <ShopPreview shop={shop} products={products || []} />
                     )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default function ShopsList() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isApproving, setIsApproving] = useState<string | null>(null);

    const shopsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collectionGroup(firestore, 'shops'));
    }, [firestore]);

    const { data: shops, isLoading, error, forceRefresh } = useCollection<Shop>(shopsQuery);

    const handleApprove = async (shop: Shop) => {
        setIsApproving(shop.id);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error('Authentication failed.');

            await fetch('/api/admin', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'approveShop',
                    payload: { shopId: shop.id, companyId: shop.companyId }
                })
            });
            
            toast({
                title: 'Shop Approved!',
                description: 'The shop is now public and live on the platform.',
            });
            forceRefresh();
        } catch (e: any) {
             toast({
                variant: 'destructive',
                title: 'Approval Failed',
                description: e.message || 'An unexpected error occurred.',
            });
        }
        setIsApproving(null);
    };
    
    const formatDate = (isoString: string | undefined) => {
        if (!isoString) return 'N/A';
        try {
            return new Date(isoString).toLocaleString('en-ZA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'});
        } catch (e) {
            return 'Invalid Date';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Store /> Shop Management</CardTitle>
                <CardDescription>Review, approve, and manage all member shops on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading && (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                {error && (
                     <div className="text-destructive-foreground bg-destructive/90 p-4 rounded-md">
                        <h4 className="font-semibold">Error loading shops</h4>
                        <p className="text-sm">{error.message}</p>
                    </div>
                )}
                {shops && !isLoading && (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Shop Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Company ID</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {shops.map(shop => (
                                    <TableRow key={shop.id}>
                                        <TableCell>{formatDate(shop.createdAt)}</TableCell>
                                        <TableCell className="font-medium">{shop.shopName}</TableCell>
                                        <TableCell>{shop.category}</TableCell>
                                        <TableCell className="font-mono text-xs max-w-[150px] truncate">{shop.companyId}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={statusColors[shop.status] || 'secondary'} className="capitalize">
                                                {shop.status?.replace(/_/g, ' ') || 'N/A'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <ShopPreviewDialog shop={shop} />
                                            {shop.status === 'pending_review' && (
                                                <Button 
                                                    variant="default" 
                                                    size="sm"
                                                    onClick={() => handleApprove(shop)}
                                                    disabled={isApproving === shop.id}
                                                >
                                                    {isApproving === shop.id ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                    )}
                                                    Approve
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
                 {shops && shops.length === 0 && !isLoading && (
                    <p className="text-center text-muted-foreground py-10">No shops found.</p>
                )}
            </CardContent>
        </Card>
    );
}
