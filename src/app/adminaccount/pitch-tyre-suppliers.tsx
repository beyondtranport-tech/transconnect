'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle, Target, DollarSign, Users, Sparkles } from "lucide-react";
import Image from "next/image";
import data from "@/lib/placeholder-images.json";
import Link from "next/link";
import * as gtag from '@/lib/gtag';

const { placeholderImages } = data;

const tyreSupplierHero = placeholderImages.find(p => p.id === 'product-tires');

const problems = [
    "High marketing costs to reach a fragmented customer base.",
    "Difficulty differentiating your brand in a competitive market.",
    "Wasted sales efforts chasing unqualified leads.",
    "Limited visibility among independent owner-operators and small fleets."
];

const solutions = [
    {
        icon: <Target className="h-8 w-8 text-primary" />,
        title: "Direct Market Access",
        description: "Your virtual storefront in our Supplier Mall puts you directly in front of thousands of transport businesses. No more middlemen, no more wasted outreach."
    },
    {
        icon: <DollarSign className="h-8 w-8 text-primary" />,
        title: "Zero-Cost Marketing Channel",
        description: "Listing your products in our Supplier Mall is free. Be discovered by qualified buyers who need your products right now, without spending a cent on advertising."
    },
    {
        icon: <Users className="h-8 w-8 text-primary" />,
        title: "Build Brand Loyalty",
        description: "Become a preferred, trusted supplier within the TransConnect ecosystem. Offer exclusive member deals and build lasting relationships with a loyal customer base."
    }
];

export default function PitchTyreSuppliers() {
    const handleJoinClick = () => {
        if (!process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID) return;
        gtag.event({
            action: 'join_as_supplier',
            category: 'Supplier Pitch',
            label: 'Tyres',
            value: 1
        });
    };

    return (
        <div className="space-y-12">
            <section className="relative w-full h-72 rounded-xl overflow-hidden">
                 {tyreSupplierHero && (
                    <Image
                        src={tyreSupplierHero.imageUrl}
                        alt="Tyre Supplier Pitch"
                        fill
                        className="object-cover"
                        priority
                        data-ai-hint={tyreSupplierHero.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative h-full flex flex-col items-center justify-center text-center text-primary-foreground z-10 p-4">
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">Your Direct Route to the Tyre Market</h1>
                    <p className="mt-4 text-lg md:text-xl max-w-3xl">Stop chasing leads. Start selling directly to a captive audience of transporters who need your products.</p>
                </div>
            </section>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Target className="h-6 w-6 text-destructive" />
                        The Challenge for Tyre Suppliers
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg text-muted-foreground mb-6">
                        The transport industry is vast, but reaching the right customers—the ones ready to buy—is a constant challenge. You're likely facing:
                    </p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {problems.map((problem, index) => (
                            <li key={index} className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg">
                                <ArrowRight className="h-5 w-5 text-destructive flex-shrink-0" />
                                <span className="text-muted-foreground">{problem}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

             <section className="py-12">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold font-headline">The Logistics Flow Advantage</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        We don't just give you another place to list products. We give you a direct, cost-effective sales channel integrated into the daily operations of your target customers.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {solutions.map((solution) => (
                         <Card key={solution.title} className="text-center">
                            <CardHeader className="items-center">
                                <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                                    {solution.icon}
                                </div>
                                <CardTitle>{solution.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{solution.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            <Card className="bg-primary/5 border-primary/20 text-center">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold font-headline">Ready to Boost Your Sales?</CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="text-lg text-muted-foreground mb-6">
                        Join our network of approved suppliers today. Create your professional shop, list your products, and start connecting with buyers immediately.
                    </p>
                    <Button asChild size="lg" onClick={handleJoinClick}>
                        <Link href="/join?role=vendor&category=tyres">
                            Become a Supplier Partner <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
