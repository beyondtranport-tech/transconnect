
'use client';

import { useDoc, useCollection, useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/hooks/use-memo-firebase';
import { collection, doc, query } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { notFound, useParams } from 'next/navigation';
import { ShopPreview } from '@/components/shop-preview';
import React, { useEffect, useState } from 'react';

export default function PublicShopPage() {
    const params = useParams();
    const shopId = params.shopId as string;
    const firestore = useFirestore();
    const [ready, setReady] = useState(false);

    // Defer initialization to ensure params are fully resolved by Next.js
    useEffect(() => {
        if (shopId) setReady(true);
    }, [shopId]);

    const shopRef = useMemoFirebase(() => {
        if (!firestore || !ready || !shopId) return null;
        return doc(firestore, 'shops', shopId);
    }, [firestore, ready, shopId]);
    
    const productsQuery = useMemoFirebase(() => {
        if (!firestore || !ready || !shopId) return null;
        return query(collection(firestore, `shops/${shopId}/products`));
    }, [firestore, ready, shopId]);

    const { data: shop, isLoading: isShopLoading } = useDoc(shopRef);
    const { data: products, isLoading: areProductsLoading } = useCollection(productsQuery);
    
    const isLoading = isShopLoading || areProductsLoading || !ready;

    // Use a secondary check for "not found" only after initial loading is confirmed complete
    if (!isLoading && !isShopLoading && !shop) {
        return notFound();
    }
    
    if (isLoading) {
         return (
            <div className="flex flex-col justify-center items-center h-screen gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Loading Digital Branch...</p>
            </div>
        );
    }
    
    if (!shop) return notFound();

    return <ShopPreview shop={shop} products={products || []} />;
}
