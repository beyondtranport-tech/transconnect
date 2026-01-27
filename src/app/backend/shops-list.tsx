
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Store, CheckCircle, Eye, Handshake } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCollection, useFirestore, getClientSideAuthToken } from '@/firebase';
import { useMemoFirebase } from '@/hooks/use-config';
import { collection, query, where, collectionGroup, orderBy } from 'firebase/firestore';
import { ShopPreview } from '@/components/shop-preview';
import MemberCommercials from './wallet/[memberId]/member-commercials';

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
    
    const productsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, `companies/${shop.companyId}/shops/${shop.id}/products`));
    }, [firestore, shop.id, shop.companyId]);

    const { data: products, isLoading } = useCollection(productsQuery);

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

function ShopCommercialsDialog({ shop }: { shop: Shop }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Handshake className="mr-2 h-4 w-4" /> Commercials
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <MemberCommercials companyId={shop.companyId} shopId={shop.id} />
      </DialogContent>
    </Dialog>
  );
}

export default function ShopsList() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isApproving, setIsApproving] = useState<string | null>(null);

    const shopsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collectionGroup(firestore, 'shops'), where('status', '==', 'pending_review'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: shops, isLoading, error, forceRefresh } = useCollection<Shop>(shopsQuery);

    const handleApprove = async (shop: Shop) => {
        setIsApproving(shop.id);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error('Authentication failed.');

            const response = await fetch('/api/admin', {
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

             const result = await response.json();
             if (!response.ok) throw new Error(result.error || 'Failed to approve shop.');
            
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
            const date = typeof isoString === 'string' ? new Date(isoString) : (isoString as any).toDate();
            if (isNaN(date.getTime())) return 'Invalid Date';
            return date.toLocaleString('en-ZA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'});
        } catch (e) {
            return 'Invalid Date';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Store /> Shop Approval Queue</CardTitle>
                <CardDescription>Review and approve member shops submitted for publication.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                ) : error ? (
                     <div className="text-destructive-foreground bg-destructive/90 p-4 rounded-md">
                        <h4 className="font-semibold">Error loading shops</h4>
                        <p className="text-sm">{error.message}</p>
                    </div>
                ) : shops && shops.length > 0 ? (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Submitted</TableHead>
                                    <TableHead>Shop Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Company ID</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {shops.map(shop => (
                                    <TableRow key={`${shop.companyId}-${shop.id}`}>
                                        <TableCell>{formatDate(shop.createdAt)}</TableCell>
                                        <TableCell className="font-medium">{shop.shopName}</TableCell>
                                        <TableCell>{shop.category}</TableCell>
                                        <TableCell className="font-mono text-xs max-w-[150px] truncate">{shop.companyId}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <ShopPreviewDialog shop={shop} />
                                            <ShopCommercialsDialog shop={shop} />
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
                                                Approve Shop
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="text-center py-20 border-2 border-dashed rounded-lg">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                        <h3 className="mt-4 text-xl font-semibold">All Clear!</h3>
                        <p className="mt-2 text-muted-foreground">There are no shops currently awaiting review.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
