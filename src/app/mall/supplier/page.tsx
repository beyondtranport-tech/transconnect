
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { placeholderImages } from "@/lib/placeholder-images.json";
import { Building2, Search, Star, ArrowRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as gtag from '@/lib/gtag';

const supplierMallImage = placeholderImages.find(p => p.id === 'mall-division');

const featuredSuppliers = [
    { 
        id: "global-parts-inc",
        name: "Global Parts Inc.", 
        category: "Engine & Drivetrain",
        rating: 4.5,
        image: placeholderImages.find(p => p.id === 'tech-division'),
    },
    { 
        id: "tiremax-pro",
        name: "TireMax Pro", 
        category: "Tires & Wheels",
        rating: 4.8,
        image: placeholderImages.find(p => p.id === 'product-tires'),
    },
    { 
        id: "advanced-auto-electrical",
        name: "Advanced Auto Electrical", 
        category: "Electrical & Lighting",
        rating: 4.2,
        image: placeholderImages.find(p => p.id === 'tech-home'),
    },
    { 
        id: "brake-clutch-specialists",
        name: "Brake & Clutch Specialists", 
        category: "Brakes & Suspension",
        rating: 4.6,
        image: placeholderImages.find(p => p.id === 'hero-home'),
    },
]

export default function SupplierMallPage() {

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
            label: 'Header CTA',
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
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">Featured Suppliers</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Top-rated suppliers trusted by the TransConnect community.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {featuredSuppliers.map(supplier => (
                            <Card key={supplier.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
                                {supplier.image && (
                                    <div className="relative aspect-video">
                                        <Image
                                            src={supplier.image.imageUrl}
                                            alt={supplier.name}
                                            fill
                                            className="object-cover"
                                            data-ai-hint={supplier.image.imageHint}
                                        />
                                    </div>
                                )}
                                <CardHeader>
                                    <CardTitle className="text-xl">{supplier.name}</CardTitle>
                                    <CardDescription>{supplier.category}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                     <div className="flex items-center gap-1">
                                        <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                                        <span className="font-semibold">{supplier.rating.toFixed(1)}</span>
                                        <span className="text-sm text-muted-foreground">/ 5.0</span>
                                    </div>
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
                     <div className="text-center mt-16">
                        <Button size="lg" onClick={handleClaimProfileClick}>
                            <Sparkles className="mr-2 h-5 w-5" />
                            Are you a supplier? Get Featured Today!
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
