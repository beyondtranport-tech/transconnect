
'use client';

import { useState, useEffect } from 'react';
import { getShops, approveShop } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Store, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Shop {
    id: string;
    shopName: string;
    ownerId: string;
    category: string;
    status: 'draft' | 'pending_review' | 'approved' | 'rejected';
    createdAt: string;
}

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  draft: 'secondary',
  pending_review: 'outline',
  approved: 'default',
  rejected: 'destructive',
};

export default function ShopsList() {
    const [shops, setShops] = useState<Shop[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isApproving, setIsApproving] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    async function fetchShops() {
        setIsLoading(true);
        try {
            const result = await getShops();
            if (result.success && result.data) {
                setShops(result.data as Shop[]);
            } else {
                setError(result.error || 'Failed to fetch shops.');
            }
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchShops();
    }, []);

    const handleApprove = async (shopId: string, ownerId: string) => {
        setIsApproving(shopId);
        const result = await approveShop(shopId, ownerId);
        if (result.success) {
            toast({
                title: 'Shop Approved!',
                description: 'The shop is now public and live on the platform.',
            });
            // Refresh the list to show the new status
            fetchShops();
        } else {
            toast({
                variant: 'destructive',
                title: 'Approval Failed',
                description: result.error || 'An unexpected error occurred.',
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
                        <p className="text-sm">{error}</p>
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
                                    <TableHead>Owner ID</TableHead>
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
                                        <TableCell className="font-mono text-xs max-w-[150px] truncate">{shop.ownerId}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={statusColors[shop.status] || 'secondary'} className="capitalize">
                                                {shop.status?.replace(/_/g, ' ') || 'N/A'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {shop.status === 'pending_review' && (
                                                <Button 
                                                    variant="default" 
                                                    size="sm"
                                                    onClick={() => handleApprove(shop.id, shop.ownerId)}
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
