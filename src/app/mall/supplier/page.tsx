
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import data from "@/lib/placeholder-images.json";
import { Building2, Search, Star, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as gtag from '@/lib/gtag';
import { usePublicCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

const { placeholderImages } = data;

const supplierMallImage = placeholderImages.find(p => p.id === 'mall-division');

export default function SupplierMallPage() {
    // This query is now self-contained and does not depend on an external firestore instance.
    const shopsQuery = useMemoFirebase(() => {
        return query(collection(getFirestore(getApp()), 'shops'), where('status', '==', 'approved'));
    }, []);

    const { data: suppliers, isLoading } = usePublicCollection(shopsQuery);

    const handleSupplierClick = (supplierId: string) => {
        gtag.event({
            action: 'view_supplier_profile',
            category: 'Supplier Mall',
            label: supplierId,
            value: 0
        });
    };

    const handleClaimProfileClick = () => {
        gtag.event({
            action: 'claim_profile_click',
            category: 'Supplier Mall',
            label: 'Footer CTA',
            value: 0
        });
    };


    return (
        <div>
            <section className="relative w-full h-80 bg-card">
                {supplierMallImage && (
                    <Image
                        src={supplierMallImage.imageUrl}
                        alt="Supplier Mall"
                        fill
                        className="object-cover"
                        priority
                        data-ai-hint={supplierMallImage.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative h-full flex flex-col items-center justify-center text-center text-primary-foreground z-10 p-4">
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">Supplier Mall</h1>
                    <p className="mt-4 text-lg md:text-xl max-w-3xl">Your direct connection to a network of vetted, high-quality parts and service suppliers.</p>
                </div>
            </section>
            
            <section id="search-suppliers" className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4">
                     <div className="max-w-4xl mx-auto">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Search className="h-6 w-6"/>
                                    Find a Supplier
                                </CardTitle>
                                <CardDescription>Search by name, category, or location to find the right partner for your needs.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input placeholder="Supplier name or keyword..." className="md:col-span-2" />
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Categories" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="parts">Parts</SelectItem>
                                            <SelectItem value="tires">Tires</SelectItem>
                                            <SelectItem value="maintenance">Maintenance</SelectItem>
                                            <SelectItem value="insurance">Insurance</SelectItem>
                                            <SelectItem value="consumables">Consumables</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button className="w-full md:col-span-3">Search Suppliers</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

             <section id="featured-suppliers" className="py-16 md:py-24 bg-card">
                <div className="container mx-auto px-4">
                     <div className="text-center max-w-3xl mx-auto mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">Approved Suppliers</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Top-rated suppliers trusted by the TransConnect community.
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        </div>
                    ) : suppliers && suppliers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {suppliers.map(supplier => (
                                <Card key={supplier.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
                                    <div className="relative aspect-video bg-muted">
                                        {supplier.heroBannerUrl ? (
                                            <Image
                                                src={supplier.heroBannerUrl}
                                                alt={supplier.shopName}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <Building2 className="h-12 w-12 text-muted-foreground"/>
                                            </div>
                                        )}
                                    </div>
                                    <CardHeader>
                                        <CardTitle className="text-xl">{supplier.shopName}</CardTitle>
                                        <CardDescription>{supplier.category}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        {/* Future content like rating can go here */}
                                    </CardContent>
                                    <CardFooter>
                                        <Button asChild className="w-full" onClick={() => handleSupplierClick(supplier.id)}>
                                            <Link href={`/mall/supplier/${supplier.id}`}>
                                                View Profile <ArrowRight className="ml-2" />
                                            </Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center py-20 border-2 border-dashed rounded-lg">
                            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-xl font-semibold">No suppliers found.</h3>
                            <p className="mt-2 text-muted-foreground">Check back later as new suppliers are approved and added to the mall.</p>
                        </div>
                    )}
                     <div className="text-center mt-16">
                        <Button size="lg" onClick={handleClaimProfileClick}>
                            <Sparkles className="mr-2 h-5 w-5" />
                            Are you a supplier? Create Your Shop!
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
