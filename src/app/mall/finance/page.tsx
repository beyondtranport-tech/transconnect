
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { placeholderImages } from "@/lib/placeholder-images.json";
import { Landmark, University, HandCoins, Building, Users, Sparkles, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as gtag from '@/lib/gtag';

const financeMallImage = placeholderImages.find(p => p.id === 'funding-division');

const financierCategories = [
    { 
        id: "banks",
        name: "Banks", 
        description: "Traditional financing from major financial institutions for established businesses.",
        icon: University,
    },
    { 
        id: "niche-lenders",
        name: "Niche Lenders", 
        description: "Specialized lenders who understand the transport industry, like our own TransConnect Funding division.",
        icon: Landmark,
    },
    { 
        id: "debt-funders",
        name: "Debt Funders", 
        description: "Alternative debt financing options for growth, expansion, or large-scale asset acquisition.",
        icon: Building,
    },
    { 
        id: "ngos-and-grants",
        name: "NGOs & Grants", 
        description: "Access funding from non-governmental organizations and grant programs aimed at supporting transport businesses.",
        icon: HandCoins,
    },
    {
        id: "individuals",
        name: "Individuals",
        description: "Peer-to-peer and crowdfunding platforms to source capital directly from individual investors.",
        icon: Users,
    }
]

export default function FinanceMallPage() {

    const handleApplyClick = () => {
        gtag.event({
            action: 'apply_for_funding',
            category: 'Finance Mall',
            label: 'Hero CTA',
            value: 0
        });
    };
    
    const handleJoinNetworkClick = () => {
         gtag.event({
            action: 'join_financier_network',
            category: 'Finance Mall',
            label: 'Footer CTA',
            value: 0
        });
    }

    const handleCategoryClick = (categoryId: string) => {
        gtag.event({
            action: 'view_financier_category',
            category: 'Finance Mall',
            label: categoryId,
            value: 0
        });
    };

    return (
        <div>
            <section className="relative w-full h-80 bg-card">
                {financeMallImage && (
                    <Image
                        src={financeMallImage.imageUrl}
                        alt="Finance Mall"
                        fill
                        className="object-cover"
                        priority
                        data-ai-hint={financeMallImage.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative h-full flex flex-col items-center justify-center text-center text-primary-foreground z-10 p-4">
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">Finance Mall</h1>
                    <p className="mt-4 text-lg md:text-xl max-w-3xl">Your central hub for finding the right funding. We connect you with a diverse network of financiers to fuel your business's growth.</p>
                     <Button size="lg" className="mt-8" onClick={handleApplyClick}>Apply For Funding</Button>
                </div>
            </section>
            
             <section id="financier-categories" className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4">
                     <div className="text-center max-w-3xl mx-auto mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">Our Financier Network</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            From traditional banks to modern crowdfunding, our network is designed to provide a wide range of financing options to meet your specific needs.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {financierCategories.map(category => {
                            const Icon = category.icon;
                            return (
                                <Card key={category.name} className="flex flex-col">
                                    <CardHeader className="flex-row items-center gap-4">
                                        <div className="bg-primary/10 p-3 rounded-lg">
                                            <Icon className="h-8 w-8 text-primary" />
                                        </div>
                                        <CardTitle className="text-xl">{category.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <p className="text-muted-foreground">{category.description}</p>
                                    </CardContent>
                                    <CardFooter>
                                        <Button asChild variant="outline" className="w-full" onClick={() => handleCategoryClick(category.id)}>
                                            <Link href={`/mall/finance/${category.id}`}>
                                                Learn More
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )
                        })}
                    </div>
                    <div className="text-center mt-16">
                        <Button size="lg" onClick={handleJoinNetworkClick}>
                            <Sparkles className="mr-2 h-5 w-5" />
                           Are you a financier? Join Our Network
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
