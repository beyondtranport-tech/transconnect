'use client';

import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Store, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { ShopPreview } from '@/components/shop-preview';

function ShopPageContent({ params }: { params: { shopId: string } }) {
    const firestore = useFirestore();

    const shopRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'shops', params.shopId);
    }, [firestore, params.shopId]);
    
    const productsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // Correctly query the public subcollection
        return query(collection(firestore, `shops/${params.shopId}/products`));
    }, [firestore, params.shopId]);

    const { data: shop, isLoading: isShopLoading } = useDoc(shopRef);
    const { data: products, isLoading: areProductsLoading } = useCollection(productsQuery);
    
    const isLoading = isShopLoading || areProductsLoading;

    if (!isLoading && !shop) {
        notFound();
    }
    
    if (isLoading) {
         return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!shop) {
        // This case will be hit if loading is done and shop is still null
        return notFound();
    }

    return <ShopPreview shop={shop} products={products || []} />;
}


export default function PublicShopPage({ params }: { params: { shopId: string }}) {
    return <ShopPageContent params={params} />
}
