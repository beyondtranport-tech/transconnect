
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, MoreVertical, CheckCircle, Eye, XCircle } from 'lucide-react';
import { ShopPreview } from '@/components/shop-preview';
import { collection, query } from 'firebase/firestore';
import { useCollection, useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/hooks/use-config';

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

function ShopPreviewDialog({ shop }: { shop: any }) {
    const [products, setProducts] = useState<any[]>([]);
    const firestore = useFirestore();

    const productsQuery = useMemoFirebase(() => {
        if (!firestore || !shop?.id) return null;
        return query(collection(firestore, `companies/${shop.companyId}/shops/${shop.id}/products`));
    }, [firestore, shop]);

    const { data: fetchedProducts, isLoading } = useCollection(productsQuery);

    useEffect(() => {
        if(fetchedProducts) {
            setProducts(fetchedProducts);
        }
    }, [fetchedProducts]);
    
    return (
        <Dialog>
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
                     {isLoading ? (
                        <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin h-10 w-10" /></div>
                     ) : (
                        <ShopPreview shop={shop} products={products} />
                     )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

export function ShopActionMenu({ shop, onUpdate }: { shop: any, onUpdate: () => void }) {
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
            
            const actionName = actionToConfirm === 'approve' ? 'approveShop' : 'rejectShop';

            await fetchFromAdminAPI(token, actionName, payload);

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
