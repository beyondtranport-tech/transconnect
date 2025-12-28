
'use client';

import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Store, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

const formatPrice = (price: number) => {
    if (typeof price !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(price);
};

function ShopPageContent({ params }: { params: { shopId: string } }) {
    const firestore = useFirestore();

    const shopRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'shops', params.shopId);
    }, [firestore, params.shopId]);

    const productsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'shops', params.shopId, 'products'));
    }, [firestore, params.shopId]);

    const { data: shop, isLoading: isShopLoading } = useDoc(shopRef);
    const { data: products, isLoading: areProductsLoading } = useCollection(productsQuery);
    
    const isLoading = isShopLoading || areProductsLoading;

    if (!isLoading && !shop) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-16">
            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : shop && (
                <div>
                     <Card className="mb-8">
                        <CardHeader>
                            <CardTitle className="text-4xl font-headline flex items-center gap-4">
                                <Store className="h-10 w-10 text-primary" />
                                {shop.shopName}
                            </CardTitle>
                            <CardDescription className="text-lg">{shop.shopDescription}</CardDescription>
                        </CardHeader>
                     </Card>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="md:col-span-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Categories</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        <li><Button variant="link" className="p-0 h-auto">All Products</Button></li>
                                        {/* TODO: Add dynamic categories based on products */}
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="md:col-span-3">
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {areProductsLoading ? (
                                    <p>Loading products...</p>
                                ) : products && products.length > 0 ? (
                                    products.map(product => (
                                         <Card key={product.id} className="flex flex-col overflow-hidden">
                                            {product.imageUrl ? (
                                                <div className="relative aspect-square">
                                                     <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                                                </div>
                                            ) : (
                                                <div className="aspect-square bg-muted flex items-center justify-center">
                                                    <ShoppingCart className="h-12 w-12 text-muted-foreground"/>
                                                </div>
                                            )}
                                            <CardHeader>
                                                <CardTitle className="text-lg">{product.name}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="flex-grow">
                                                <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                                            </CardContent>
                                            <CardFooter className="flex justify-between items-center">
                                                <p className="font-bold text-lg">{formatPrice(product.price)}</p>
                                                <Button size="sm">Add to Cart</Button>
                                            </CardFooter>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-12">
                                        <p className="text-muted-foreground">This shop has not added any products yet.</p>
                                    </div>
                                )}
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


export default function PublicShopPage({ params }: { params: { shopId: string }}) {
    return <ShopPageContent params={params} />
}
