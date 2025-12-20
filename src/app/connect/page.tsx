
'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Check, Gift, Heart, Zap, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { placeholderImages } from "@/lib/placeholder-images.json";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { DataContributionModal } from "./data-contribution-modal";
import React from "react";
import * as gtag from '@/lib/gtag';

const connectHeroImage = placeholderImages.find(p => p.id === 'tech-division');
const opportunityImage = placeholderImages.find(p => p.id === 'mall-division');

const iconMap: { [key: string]: React.ElementType } = {
    "Rewards Plan": Gift,
    "Loyalty Plan": Heart,
    "Actions Plan": Zap,
};

const plans = [
    {
        id: "rewards",
        title: "Rewards Plan",
        price: 50,
        description: "Claim your share to discounts and save",
        features: [
            "Earn points on all Mall purchases",
            "Redeem points for fuel vouchers",
            "Access exclusive member-only products"
        ],
        cta: "Activate Rewards Plan"
    },
    {
        id: "loyalty",
        title: "Loyalty Plan",
        price: 50,
        description: "Join our loyalty plan, your path to increasing your share of the rewards.",
        features: [
            "Unlock deep discounts from our network of trusted suppliers.",
            "Get exclusive pricing on parts & tires",
            "Receive special offers from partners",
            "Priority access to new suppliers"
        ],
        cta: "Activate Loyalty Plan"
    },
    {
        id: "actions",
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
    // On the server, Node.js might use a non-breaking space.
    // On the client, it might be a regular space.
    // We normalize to a regular space to prevent hydration mismatches.
    return formattedPrice.replace(/\s/g, ' ');
};

const tierPercentages = [20, 40, 60, 80];

export default function ConnectPage() {
    const [monthlySpend, setMonthlySpend] = useState(20000);
    const [supplierDiscount, setSupplierDiscount] = useState(7.5);
    const [loyaltyTier, setLoyaltyTier] = useState(4); // Represents tier 1, 2, 3, 4
    const [potentialSavings, setPotentialSavings] = useState(0);
    const [isClient, setIsClient] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        const loyaltyShare = tierPercentages[loyaltyTier - 1];
        const savings = monthlySpend * (supplierDiscount / 100) * (loyaltyShare / 100);
        setPotentialSavings(savings);
    }, [monthlySpend, supplierDiscount, loyaltyTier]);
    
    const handleSliderInteraction = <T extends number | number[]>(setter: React.Dispatch<React.SetStateAction<T>>) => (value: T) => {
        if (!hasInteracted) {
            setHasInteracted(true);
            setIsModalOpen(true);
        }
        setter(value);
    }
    
    const handlePlanExplore = (planId: string) => {
        gtag.event({
            action: 'explore_plan',
            category: 'Connect Page',
            label: planId,
            value: 0
        });
    };


    return (
        <div>
            <DataContributionModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
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

            <section id="plans-section" className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">Unlock Your Potential</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Choose one or more plans to unlock the full financial power of the TransConnect ecosystem. Each plan is a tool designed to directly impact your bottom line.
                        </p>
                    </div>

                    <div className="space-y-16">
                        {plans.map((plan, index) => {
                            const IconComponent = iconMap[plan.title];
                            return (
                                <div key={plan.title} className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                                    <div className={`relative aspect-video rounded-lg overflow-hidden shadow-lg ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                                         {opportunityImage && (
                                            <Image
                                                src={opportunityImage.imageUrl}
                                                alt={plan.title}
                                                fill
                                                className="object-cover"
                                                data-ai-hint={opportunityImage.imageHint}
                                            />
                                         )}
                                    </div>
                                    <div className={index % 2 === 1 ? 'md:order-1' : ''}>
                                        <div className="flex items-center gap-4">
                                            {IconComponent && <IconComponent className="h-10 w-10 text-primary" />}
                                            <h3 className="text-3xl font-bold font-headline">{plan.title}</h3>
                                        </div>
                                        <p className="mt-2 text-lg font-semibold text-primary">{formatPrice(plan.price)}/month</p>
                                        <p className="mt-4 text-lg text-muted-foreground">
                                            {plan.description}
                                        </p>
                                        <Button asChild className="mt-8" onClick={() => handlePlanExplore(plan.id)}>
                                            <Link href={`/connect/${plan.id}`}>
                                                Find Out More <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
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
                                    onValueChange={handleSliderInteraction((value) => setMonthlySpend(value[0]))}
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
                                    onValueChange={handleSliderInteraction((value) => setSupplierDiscount(value[0]))}
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
                                    onValueChange={handleSliderInteraction((value) => setLoyaltyTier(value[0]))}
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
