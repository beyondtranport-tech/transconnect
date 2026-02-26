'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import data from "@/lib/placeholder-images.json";
import { Network, Eye, BarChart, Truck } from "lucide-react";
import Link from "next/link";

const { placeholderImages } = data;
const supplyChainHeroImage = placeholderImages.find(p => p.id === 'supply-chain-hero');

const features = [
    {
        icon: <Eye className="h-8 w-8 text-primary" />,
        title: "Real-time Visibility",
        description: "Track shipments, monitor inventory levels, and get real-time updates across your entire supply chain from a single dashboard."
    },
    {
        icon: <BarChart className="h-8 w-8 text-primary" />,
        title: "Demand Forecasting",
        description: "Leverage AI to predict demand, optimize stock levels, and reduce carrying costs by ensuring you have the right inventory at the right time."
    },
    {
        icon: <Truck className="h-8 w-8 text-primary" />,
        title: "Automated Procurement",
        description: "Set up rules to automatically re-order parts and consumables when stock levels are low, streamlining your procurement process."
    },
    {
        icon: <Network className="h-8 w-8 text-primary" />,
        title: "Supplier & Carrier Network",
        description: "Connect with a broader network of suppliers and carriers to find better pricing, faster delivery times, and more reliable partners."
    }
];

export default function SupplyChainPage() {
    return (
        <div>
            <section className="relative w-full h-80 bg-card">
                {supplyChainHeroImage && (
                    <Image
                        src={supplyChainHeroImage.imageUrl}
                        alt={supplyChainHeroImage.description}
                        fill
                        className="object-cover"
                        priority
                        data-ai-hint={supplyChainHeroImage.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative h-full flex flex-col items-center justify-center text-center text-primary-foreground z-10 p-4">
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">The Supply Chain Hub</h1>
                    <p className="mt-4 text-lg md:text-xl max-w-3xl">An integrated control tower for your logistics operations, coming soon.</p>
                </div>
            </section>
            
            <section className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4">
                     <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">End-to-End Supply Chain Management</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                           The Supply Chain Hub will provide a unified platform to manage every aspect of your supply chain, from procurement to final delivery, powered by data and AI.
                        </p>
                    </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature) => (
                            <Card key={feature.title} className="text-center">
                                <CardHeader>
                                     <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                                        {feature.icon}
                                    </div>
                                    <CardTitle>{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">{feature.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="text-center mt-16">
                         <Card className="max-w-2xl mx-auto p-8 bg-card">
                             <CardTitle>Coming Soon</CardTitle>
                            <CardDescription className="mt-2">
                                We are hard at work building this powerful new division. Stay tuned for updates on its launch.
                            </CardDescription>
                            <CardFooter className="mt-6 justify-center">
                                 <Button asChild>
                                    <Link href="/account">Return to Dashboard</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </section>
        </div>
    );
}
