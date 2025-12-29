
'use client';

import { useDoc, usePublicCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query } from 'firebase/firestore';
import { Building2, Loader2, Mail, Phone, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ShopPreview } from '@/components/shop-preview';


function SupplierProfile({ params }: { params: { supplierId: string }}) {
    const firestore = useFirestore();

    const supplierRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'shops', params.supplierId);
    }, [firestore, params.supplierId]);
    
    const productsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // Correctly query the public subcollection
        return query(collection(firestore, `shops/${params.supplierId}/products`));
    }, [firestore, params.supplierId]);

    const { data: supplier, isLoading: isShopLoading } = useDoc(supplierRef);
    const { data: products, isLoading: areProductsLoading } = usePublicCollection(productsQuery);
    
    const isLoading = isShopLoading || areProductsLoading;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[80vh]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    if (!supplier) {
        notFound();
    }
    
    // We now pass the live supplier and product data to the ShopPreview component
    return <ShopPreview shop={supplier} products={products || []} />;
}

export default function SupplierProfilePage({ params }: { params: { supplierId: string } }) {
    return <SupplierProfile params={params} />;
}
