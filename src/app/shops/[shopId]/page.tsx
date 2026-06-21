
'use client';

import { useDoc, useCollection, useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/hooks/use-memo-firebase';
import { collection, doc, query } from 'firebase/firestore';
import { Loader2, Store } from 'lucide-react';
import { notFound, useParams } from 'next/navigation';
import { ShopPreview } from '@/components/shop-preview';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PublicShopPage() {
    const params = useParams();
    const shopId = params?.shopId as string;
    const firestore = useFirestore();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const shopRef = useMemoFirebase(() => {
        if (!firestore || !shopId || !isClient) return null;
        return doc(firestore, 'shops', shopId);
    }, [firestore, shopId, isClient]);
    
    const productsQuery = useMemoFirebase(() => {
        if (!firestore || !shopId || !isClient) return null;
        return query(collection(firestore, `shops/${shopId}/products`));
    }, [firestore, shopId, isClient]);

    const { data: shop, isLoading: isShopLoading, error: shopError } = useDoc(shopRef);
    const { data: products, isLoading: areProductsLoading } = useCollection(productsQuery);
    
    const isLoading = !isClient || isShopLoading || areProductsLoading;

    if (isLoading) {
         return (
            <div className="flex flex-col justify-center items-center h-screen gap-4 bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Initializing Commercial Profile...</p>
            </div>
        );
    }
    
    // Final safety check: if loading is complete and no data exists, it's a 404.
    if (!shop && !isShopLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen space-y-4 px-4 text-center">
                <Store className="h-16 w-16 text-muted-foreground opacity-20" />
                <h1 className="text-3xl font-black font-headline">Profile Not Found</h1>
                <p className="text-muted-foreground max-w-md">
                    This commercial profile hasn't been synchronized with the public registry yet. 
                    If you are the owner, please ensure your profile is submitted for approval.
                </p>
                <div className="flex gap-4 pt-4">
                    <Button asChild variant="outline">
                        <Link href="/">Return Home</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/signin">Sign In to Dashboard</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return <ShopPreview shop={shop} products={products || []} />;
}
