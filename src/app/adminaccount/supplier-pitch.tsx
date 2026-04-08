'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Target, Sparkles } from "lucide-react";
import Image from "next/image";
import data from "@/lib/placeholder-images.json";
import Link from "next/link";
import * as gtag from '@/lib/gtag';

const { placeholderImages } = data;

const supplierCategories = [
    "Accessories", "Anti-Theft Devices", "Auto Electrical", "Batteries", "Brakes", "Cleaning Products",
    "Dealer", "Diesel", "Filters", "Injectors", "Turbo", "Lights", "Mechanical Repairs",
    "Oils & Lubricants", "Parts", "Transport", "Tarpaulins", "Tow In", "Trailer Repairs",
    "Truck Parts", "Truck Repairs", "Tyres"
];

const categoryImages: { [key: string]: any } = {
    Tyres: placeholderImages.find(p => p.id === 'product-tires'),
    Diesel: placeholderImages.find(p => p.id === 'hero-home'),
    'Mechanical Repairs': placeholderImages.find(p => p.id === 'services-1'),
    'Truck Parts': placeholderImages.find(p => p.id === 'parts-1'),
    default: placeholderImages.find(p => p.id === 'mall-division')
};

const PitchComponent = ({ category }: { category: string }) => {
    const heroImage = categoryImages[category] || categoryImages.default;

    const handleJoinClick = () => {
        if (!process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID) return;
        gtag.event({
            action: 'join_as_supplier',
            category: 'Supplier Pitch',
            label: category,
            value: 1
        });
    };

    return (
        <div className="space-y-12">
            <section className="relative w-full h-72 rounded-xl overflow-hidden">
                 {heroImage && (
                    <Image
                        src={heroImage.imageUrl}
                        alt={`${category} Supplier Pitch`}
                        fill
                        className="object-cover"
                        priority
                        data-ai-hint={heroImage.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative h-full flex flex-col items-center justify-center text-center text-primary-foreground z-10 p-4">
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">Your Direct Route to the {category} Market</h1>
                    <p className="mt-4 text-lg md:text-xl max-w-3xl">Stop chasing leads. Start selling directly to a captive audience of transporters who need your products.</p>
                </div>
            </section>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Target className="h-6 w-6 text-destructive" />
                        The Challenge for {category} Suppliers
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg text-muted-foreground">
                        The transport industry is vast, but reaching the right customers—the ones ready to buy—is a constant challenge. Our platform connects you directly with a targeted, high-intent audience.
                    </p>
                </CardContent>
            </Card>
            
            <Card className="bg-primary/5 border-primary/20 text-center">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold font-headline">Ready to Boost Your Sales?</CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="text-lg text-muted-foreground mb-6">
                        Join our network of approved suppliers today. Create your professional shop, list your products, and start connecting with buyers immediately.
                    </p>
                    <Button asChild size="lg" onClick={handleJoinClick}>
                        <Link href={`/join?role=vendor&category=${encodeURIComponent(category.toLowerCase())}`}>
                            Become a {category} Supplier <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default function SupplierPitch() {
    return (
        <Tabs defaultValue="Tyres" className="w-full">
            <CardHeader>
                <CardTitle>Supplier Pitch Generator</CardTitle>
                <CardDescription>Select a supplier category to view a tailored engagement pitch.</CardDescription>
            </CardHeader>
            <CardContent>
                <TabsList className="h-auto flex-wrap justify-start">
                    {supplierCategories.map(category => (
                        <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
                    ))}
                </TabsList>

                {supplierCategories.map(category => (
                    <TabsContent key={category} value={category} className="mt-6">
                        <PitchComponent category={category} />
                    </TabsContent>
                ))}
            </CardContent>
        </Tabs>
    );
}
