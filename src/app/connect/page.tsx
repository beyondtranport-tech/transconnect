
'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Check, Gift, Heart, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { placeholderImages } from "@/lib/placeholder-images.json";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

const connectHeroImage = placeholderImages.find(p => p.id === 'tech-division');

const plans = [
    {
        icon: <Gift className="h-8 w-8 text-primary" />,
        title: "Rewards Plan",
        price: 50,
        description: "Turn every purchase into points and get tangible benefits.",
        features: [
            "Earn points on all Mall purchases",
            "Redeem points for fuel vouchers",
            "Access exclusive member-only products",
        ],
        cta: "Activate Rewards Plan"
    },
    {
        icon: <Heart className="h-8 w-8 text-primary" />,
        title: "Loyalty Plan",
        price: 50,
        description: "Unlock deep discounts from our network of trusted suppliers.",
        features: [
            "Get exclusive pricing on parts & tires",
            "Receive special offers from partners",
            "Priority access to new suppliers",
        ],
        cta: "Activate Loyalty Plan"
    },
    {
        icon: <Zap className="h-8 w-8 text-primary" />,
        title: "Actions Plan",
        price: 50,
        description: "Generate new revenue by sharing the benefits of TransConnect.",
        features: [
            "Earn commission on referrals",
            "Get paid for sharing supplier discounts",
            "Track your earnings in a dedicated dashboard",
        ],
        cta: "Activate Actions Plan"
    },
]

const formatPrice = (price: number) => {
    const formattedPrice = new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
    return typeof window === 'undefined' ? formattedPrice.replace(/\s/g, ' ') : formattedPrice;
};

const tierPercentages = [20, 40, 60, 80];

export default function ConnectPage() {
    const [monthlySpend, setMonthlySpend] = useState(20000);
    const [supplierDiscount, setSupplierDiscount] = useState(7.5);
    const [loyaltyTier, setLoyaltyTier] = useState(4); // Represents tier 1, 2, 3, 4
    const [potentialSavings, setPotentialSavings] = useState(0);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        const loyaltyShare = tierPercentages[loyaltyTier - 1];
        const savings = monthlySpend * (supplierDiscount / 100) * (loyaltyShare / 100);
        setPotentialSavings(savings);
    }, [monthlySpend, supplierDiscount, loyaltyTier]);


    return (
        <div>
            <section className="relative w-full h-80 bg-card">
                {connectHeroImage && (
                    <Image
                        src={connectHeroImage.imageUrl}
                        alt={connectHeroImage.description}
                        fill
                        className="object-cover"
                        priority
                        data-ai-hint={connectHeroImage.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-black/70" />
                <div className="relative h-full flex flex-col items-center justify-center text-center text-primary-foreground z-10 p-4">
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">Go Beyond Connecting. Start Earning.</h1>
                    <p className="mt-4 text-lg md:text-xl max-w-3xl">Our optional plans turn your network into your most valuable asset. Activate the tools to save on costs and generate new revenue streams.</p>
                </div>
            </section>

            <section id="opportunity-hub" className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">The Opportunity Hub</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Choose one or more plans to unlock the full financial power of the TransConnect ecosystem. Each plan is a tool designed to directly impact your bottom line.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                        {plans.map((plan) => (
                            <Card key={plan.title} className="flex flex-col">
                                <CardHeader className="text-center">
                                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                                        {plan.icon}
                                    </div>
                                    <CardTitle>{plan.title}</CardTitle>
                                     <CardDescription className="flex items-baseline justify-center gap-1 pt-2">
                                        <span className="text-3xl font-extrabold tracking-tight text-foreground">R{plan.price}</span>
                                        <span className="text-muted-foreground">/month</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-center text-muted-foreground mb-6">{plan.description}</p>
                                    <ul className="space-y-3">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-start">
                                                <Check className="h-5 w-5 text-primary mr-3 shrink-0 mt-0.5" />
                                                <span className="text-muted-foreground">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" asChild>
                                        <Link href="/join">{plan.cta}</Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>
             <section className="py-16 md:py-24 bg-card">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold font-headline">Calculate Your Potential Savings</h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                        Use the sliders to estimate how much you could save with the <span className="font-semibold text-primary">Loyalty Plan</span>.
                    </p>
                    <div className="mt-10 max-w-2xl mx-auto p-8 bg-background rounded-lg shadow-inner">
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <Label htmlFor="spend-slider" className="text-lg font-medium">Monthly Spend</Label>
                                    <span className="text-lg font-bold text-foreground">{isClient ? formatPrice(monthlySpend) : 'R 20,000'}</span>
                                </div>
                                <Slider
                                    id="spend-slider"
                                    min={0}
                                    max={100000}
                                    step={1000}
                                    value={[monthlySpend]}
                                    onValueChange={(value) => setMonthlySpend(value[0])}
                                />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <Label htmlFor="discount-slider" className="text-lg font-medium">Average Supplier Discount</Label>
                                    <span className="text-lg font-bold text-foreground">{supplierDiscount.toFixed(1)}%</span>
                                </div>
                                <Slider
                                    id="discount-slider"
                                    min={1}
                                    max={20}
                                    step={0.5}
                                    value={[supplierDiscount]}
                                    onValueChange={(value) => setSupplierDiscount(value[0])}
                                />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <Label htmlFor="share-slider" className="text-lg font-medium">Your Loyalty Tier</Label>
                                    <span className="text-lg font-bold text-foreground">
                                        Tier {loyaltyTier}: {tierPercentages[loyaltyTier - 1]}%
                                    </span>
                                </div>
                                <Slider
                                    id="share-slider"
                                    min={1}
                                    max={4}
                                    step={1}
                                    value={[loyaltyTier]}
                                    onValueChange={(value) => setLoyaltyTier(value[0])}
                                />
                            </div>

                            <div className="border-t border-dashed pt-4">
                                <div className="flex justify-between items-center">
                                    <p className="text-xl font-semibold">Your Potential Monthly Savings:</p>
                                    <p className="text-3xl font-bold text-primary">{isClient ? formatPrice(potentialSavings) : 'R 1,200'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Button asChild size="lg" className="mt-12">
                        <Link href="/join">Join and Activate Your Plans</Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}
