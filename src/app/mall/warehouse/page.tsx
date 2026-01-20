

'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import data from "@/lib/placeholder-images.json";
import { Warehouse, Star, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as gtag from '@/lib/gtag';

const { placeholderImages } = data;

const warehouseMallImage = placeholderImages.find(p => p.id === 'mall-division');

const featuredFacilities = [
    { 
        id: "jhb-cold-storage",
        name: "JHB Cold Storage", 
        type: "Refrigerated & Frozen",
        location: "Johannesburg, GP",
        rating: 4.8,
        image: placeholderImages.find(p => p.id === 'tech-division'),
    },
    { 
        id: "cpt-logistics-park",
        name: "CPT Logistics Park", 
        type: "Bulk & General Storage",
        location: "Cape Town, WC",
        rating: 4.7,
        image: placeholderImages.find(p => p.id === 'hero-home'),
    },
]

export default function WarehouseMallPage() {

    const handleFacilityClick = (facilityId: string) => {
        gtag.event({
            action: 'view_warehouse_facility',
            category: 'Warehouse Mall',
            label: facilityId,
            value: 0
        });
    };

    return (
        <div>
            <section className="relative w-full h-80 bg-card">
                {warehouseMallImage && (
                    <Image
                        src={warehouseMallImage.imageUrl}
                        alt="Warehouse Mall"
                        fill
                        className="object-cover"
                        priority
                        data-ai-hint={warehouseMallImage.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative h-full flex flex-col items-center justify-center text-center text-primary-foreground z-10 p-4">
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">Warehouse Mall</h1>
                    <p className="mt-4 text-lg md:text-xl max-w-3xl">Find flexible short-term and long-term storage solutions across the country.</p>
                </div>
            </section>
            
             <section id="featured-facilities" className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4">
                     <div className="text-center max-w-3xl mx-auto mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">Featured Facilities</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Top-rated warehousing facilities available for short-term or long-term lease.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {featuredFacilities.map(facility => (
                            <Link href={`/mall/warehouse/${facility.id}`} key={facility.id} className="block group" onClick={() => handleFacilityClick(facility.id)}>
                                <Card className="overflow-hidden shadow-md hover:shadow-lg transition-all h-full flex flex-col group-hover:border-primary">
                                    {facility.image && (
                                        <div className="relative aspect-video">
                                            <Image
                                                src={facility.image.imageUrl}
                                                alt={facility.name}
                                                fill
                                                className="object-cover"
                                                data-ai-hint={facility.image.imageHint}
                                            />
                                        </div>
                                    )}
                                    <CardHeader>
                                        <CardTitle className="text-xl">{facility.name}</CardTitle>
                                        <CardDescription>{facility.type} - {facility.location}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <div className="flex items-center gap-1">
                                            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                                            <span className="font-semibold">{facility.rating.toFixed(1)}</span>
                                            <span className="text-sm text-muted-foreground">/ 5.0</span>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <p className="text-sm font-semibold text-primary flex items-center gap-2">
                                            View Facility <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </p>
                                    </CardFooter>
                                </Card>
                            </Link>
                        ))}
                    </div>
                     <div className="text-center mt-16">
                        <Button size="lg" onClick={() => gtag.event({ action: 'list_warehouse_click', category: 'Warehouse Mall', label: 'Footer CTA', value: 0 })}>
                            List Your Warehouse Space
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
