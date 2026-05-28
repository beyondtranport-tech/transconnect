'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Gift, DollarSign, TrendingUp, ShoppingBasket, Presentation, Truck, Users, Ship } from 'lucide-react';
import React, { useMemo } from 'react';
import { useConfig } from '@/hooks/use-config';
import { Loader2 } from 'lucide-react';

/**
 * Dynamic Pitch Deck
 * Tailors the specific value proposition based on the partner category.
 */
export default function PitchDeck({ partner }: { partner?: any }) {
    const recipientName = partner?.firstName || 'Partner';
    const companyName = partner?.companyName || 'your business';
    const businessCategory = partner?.entryType || 'General Transport';

    const isForwarder = businessCategory === 'Freight Forwarder';
    const isHaulier = businessCategory === 'Haulier';

    const { data: isaConfig, isLoading } = useConfig<any>('isaPitch');

    const pivotContent = useMemo(() => {
        if (isForwarder) {
            return {
                title: "Pivot: Digitalized Subcontracting",
                icon: Ship,
                description: "Instead of searching for loads, we help you search for verified, high-quality capacity to fulfill your appointments."
            };
        }
        return {
            title: "Pivot: Revenue Protection",
            icon: Truck,
            description: "We protect your profit margins by reducing your largest expenses: fuel, tires, and deadhead miles."
        };
    }, [isForwarder]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    const isaMembershipShare = isaConfig?.membershipCommission || 30;
    const isaFinanceShare = isaConfig?.financeMallCommission || 20;
    const isaMarketplaceShare = isaConfig?.marketplaceCommission || 50;

    return (
        <div className="space-y-8">
            <CardHeader className="px-0 text-center">
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                    <Presentation className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold font-headline">Strategic Proposal: {companyName}</CardTitle>
                <CardDescription className="text-lg text-muted-foreground mt-2">A personalized roadmap for {recipientName} to achieve exponential growth through collaboration.</CardDescription>
            </CardHeader>

            {/* Segment Specific Pivot */}
            <Card className="border-l-4 border-l-amber-500 bg-amber-50/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {React.createElement(pivotContent.icon, { className: "h-6 w-6 text-amber-600" })}
                        {pivotContent.title}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg text-amber-900">{pivotContent.description}</p>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-primary">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Gift className="h-6 w-6 text-primary"/>The Foundational Offer</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg">As a key stakeholder in our early-stage growth, we are offering {companyName} a <strong className="text-primary">Free Lifetime Premium Membership</strong>. This ensures you have full, unrestricted access to the entire ecosystem—at no cost, forever.</p>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><DollarSign className="h-6 w-6 text-primary"/>Stream 1: Recurring Subscription Revenue</CardTitle>
                    <CardDescription>Stable, growing annuity income for {recipientName}.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>You earn a <strong className="text-primary">{isaMembershipShare}% share</strong> of all membership and subscription fees from every entity you bring into the network. This creates a predictable recurring revenue stream for {companyName}.</p>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary"/>Stream 2: Transactional Ecosystem Share</CardTitle>
                    <CardDescription>Uncapped upside from network activity.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>Your earning potential scales with the activity of your network. You earn a significant share (up to {isaFinanceShare}%) of the revenue Logistics Flow generates from your network's activity across all specialized Malls.</p>
                </CardContent>
            </Card>

            <Card className="bg-muted/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShoppingBasket className="h-6 w-6 text-primary" />Stream 3: Value-Added Reselling</CardTitle>
                    <CardDescription>Generate funds by solving problems for your contacts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>The Marketplace allows {recipientName} to offer high-demand services like RAF Assist and specialized insurance to your network. You earn a {isaMarketplaceShare}% commission on every successful sale, further diversifying your income.</p>
                </CardContent>
            </Card>

            <CardFooter className="flex flex-col items-center justify-center pt-8">
                <p className="text-xl font-semibold text-center">Ready to activate this partnership, {recipientName}?</p>
                <p className="text-muted-foreground text-center mt-2">Let's build the future of logistics together.</p>
            </CardFooter>
        </div>
    );
}
