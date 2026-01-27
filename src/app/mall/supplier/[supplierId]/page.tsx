
'use client';

import { useDoc, useCollection, useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/hooks/use-config';
import { collection, doc, query } from 'firebase/firestore';
import { Loader2 } from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { ShopPreview } from '@/components/shop-preview';


function SupplierProfile() {
    const params = useParams();
    const supplierId = params.supplierId as string;
    const firestore = useFirestore();

    const supplierRef = useMemoFirebase(() => {
        if (!firestore || !supplierId) return null;
        return doc(firestore, 'shops', supplierId);
    }, [firestore, supplierId]);
    
    const productsQuery = useMemoFirebase(() => {
        if (!firestore || !supplierId) return null;
        // Correctly query the public subcollection
        return query(collection(firestore, `shops/${supplierId}/products`));
    }, [firestore, supplierId]);

    const { data: supplier, isLoading: isShopLoading } = useDoc(supplierRef);
    const { data: products, isLoading: areProductsLoading } = useCollection(productsQuery);
    
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

export default function SupplierProfilePage() {
    return <SupplierProfile />;
}
