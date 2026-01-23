
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import data from "@/lib/placeholder-images.json";
import { Truck, Search, Star, ArrowRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as gtag from '@/lib/gtag';

const { placeholderImages } = data;

const transporterMallImage = placeholderImages.find(p => p.id === 'hero-home');

const featuredTransporters = [
    { 
        id: "abc-logistics",
        name: "ABC Logistics", 
        specialty: "Refrigerated Transport",
        rating: 4.8,
        image: placeholderImages.find(p => p.id === 'tech-division'),
    },
    { 
        id: "swift-haulers",
        name: "Swift Haulers", 
        specialty: "Long-Haul & General Freight",
        rating: 4.6,
        image: placeholderImages.find(p => p.id === 'hero-home'),
    },
    { 
        id: "cross-country-carriers",
        name: "Cross-Country Carriers", 
        specialty: "Flatbed & Oversized Loads",
        rating: 4.7,
        image: placeholderImages.find(p => p.id === 'marketplace-division'),
    },
    { 
        id: "urban-express",
        name: "Urban Express", 
        specialty: "Last-Mile Delivery",
        rating: 4.9,
        image: placeholderImages.find(p => p.id === 'tech-home'),
    },
]

export default function TransporterMallPage() {

    const handleTransporterClick = (transporterId: string) => {
        if (!process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID) return;
        gtag.event({
            action: 'view_transporter_profile',
            category: 'Transporter Mall',
            label: transporterId,
            value: 0
        });
    };

    const handleGetFeaturedClick = () => {
        if (!process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID) return;
        gtag.event({
            action: 'get_featured_click',
            category: 'Transporter Mall',
            label: 'Footer CTA',
            value: 0
        });
    };

    return (
        <div>
            <section className="relative w-full h-80 bg-card">
                {transporterMallImage && (
                    <Image
                        src={transporterMallImage.imageUrl}
                        alt="Transporter Mall"
                        fill
                        className="object-cover"
                        priority
                        data-ai-hint={transporterMallImage.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative h-full flex flex-col items-center justify-center text-center text-primary-foreground z-10 p-4">
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">Transporter Mall</h1>
                    <p className="mt-4 text-lg md:text-xl max-w-3xl">Find reliable transport partners and subcontracting opportunities to expand your network.</p>
                </div>
            </section>
            
            <section id="search-transporters" className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4">
                     <div className="max-w-4xl mx-auto">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Search className="h-6 w-6"/>
                                    Find a Partner
                                </CardTitle>
                                <CardDescription>Search by name, specialty, or location to find the right transporter.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input placeholder="Transporter name or keyword..." className="md:col-span-2" />
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Specialties" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="refrigerated">Refrigerated</SelectItem>
                                            <SelectItem value="flatbed">Flatbed</SelectItem>
                                            <SelectItem value="last-mile">Last-Mile</SelectItem>
                                            <SelectItem value="long-haul">Long-Haul</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button className="w-full md:col-span-3">Search Partners</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

             <section id="featured-transporters" className="py-16 md:py-24 bg-card">
                <div className="container mx-auto px-4">
                     <div className="text-center max-w-3xl mx-auto mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">Featured Transporters</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Top-rated transport companies in the Logistics Flow network.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {featuredTransporters.map(transporter => (
                            <Link key={transporter.id} href={`/mall/transporter/${transporter.id}`} className="block group" onClick={() => handleTransporterClick(transporter.id)}>
                                <Card className="overflow-hidden shadow-md hover:shadow-lg transition-all h-full flex flex-col group-hover:border-primary">
                                    {transporter.image && (
                                        <div className="relative aspect-video">
                                            <Image
                                                src={transporter.image.imageUrl}
                                                alt={transporter.name}
                                                fill
                                                className="object-cover"
                                                data-ai-hint={transporter.image.imageHint}
                                            />
                                        </div>
                                    )}
                                    <CardHeader>
                                        <CardTitle className="text-xl">{transporter.name}</CardTitle>
                                        <CardDescription>{transporter.specialty}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                         <div className="flex items-center gap-1">
                                            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                                            <span className="font-semibold">{transporter.rating.toFixed(1)}</span>
                                            <span className="text-sm text-muted-foreground">/ 5.0</span>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                         <p className="text-sm font-semibold text-primary flex items-center gap-2">
                                            View Profile <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </p>
                                    </CardFooter>
                                </Card>
                            </Link>
                        ))}
                    </div>
                    <div className="text-center mt-16">
                        <Button asChild size="lg" variant="outline" onClick={handleGetFeaturedClick}>
                           <Link href="/join">
                             <Sparkles className="mr-2 h-5 w-5" />
                             Want to get featured? Join Logistics Flow!
                           </Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
