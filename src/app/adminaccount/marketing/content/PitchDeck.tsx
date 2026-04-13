'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Gift, DollarSign, TrendingUp, Handshake, CheckCircle, ShoppingBasket, Award, Presentation } from 'lucide-react';
import React from 'react';
import { useConfig } from '@/hooks/use-config';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function PitchDeck() {
    const { data: isaConfig, isLoading } = useConfig<any>('isaPitch');
    const { data: mallCommissions } = useConfig<any>('mallCommissions');
    const { data: marketplaceFees } = useConfig<any>('marketplaceFees');


    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    // Static examples for illustration on the pitch page
    const exampleMembershipFee = 500;
    const exampleDealSize = 400000;
    const exampleOriginationFeePercent = 1;
    const exampleSupplierSpend = 50000;
    const exampleTruckSale = 250000;
    const exampleMarketplaceProductPrice = 40;
    const exampleMarketplacePlatformCommission = 10; // R10, which is 25% of R40

    // Dynamic rates from config
    const isaMembershipShare = isaConfig?.membershipCommission || 30;
    const isaFinanceShare = isaConfig?.financeMallCommission || 20;
    const isaSupplierShare = isaConfig?.supplierMallCommission || 20;
    const isaBuySellShare = isaConfig?.buySellMallCommission || 20;
    const isaMarketplaceShare = isaConfig?.marketplaceCommission || 50;
    
    // Derived example calculations
    const annualSubscriptionRevenue = exampleMembershipFee * 12;
    const isaAnnualSubscriptionShare = annualSubscriptionRevenue * (isaMembershipShare / 100);

    const exampleDealCommission = exampleDealSize * (exampleOriginationFeePercent / 100);
    const isaExampleDealShare = exampleDealCommission * (isaFinanceShare / 100);
    
    const supplierMallPlatformCommission = (mallCommissions?.supplierMall || 2.5) / 100;
    const supplierPlatformEarnings = exampleSupplierSpend * supplierMallPlatformCommission;
    const isaSupplierEarnings = supplierPlatformEarnings * (isaSupplierShare / 100);
    
    const buySellMallPlatformCommission = (mallCommissions?.buySellMall || 1) / 100;
    const buySellPlatformEarnings = exampleTruckSale * buySellMallPlatformCommission;
    const isaBuySellEarnings = buySellPlatformEarnings * (isaBuySellShare / 100);

    const isaMarketplaceEarnings = exampleMarketplacePlatformCommission * (isaMarketplaceShare / 100);
    const passiveIncomeExample = 240 * isaMarketplaceEarnings;


    const potentialEarnings = [
        { members: 10, annualRecurring: 10 * isaAnnualSubscriptionShare },
        { members: 50, annualRecurring: 50 * isaAnnualSubscriptionShare },
        { members: 100, annualRecurring: 100 * isaAnnualSubscriptionShare },
    ];


    return (
        <div className="space-y-8">
            <CardHeader className="px-0 text-center">
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                    <Presentation className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold font-headline">The Logistics Flow Pitch</CardTitle>
                <CardDescription className="text-lg text-muted-foreground mt-2">A true business partnership for exponential growth.</CardDescription>
            </CardHeader>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Gift className="h-6 w-6 text-primary"/>The Core Offer: A Foundation of Partnership</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg">As a foundational partner, you receive a <strong className="text-primary">Free Lifetime Premium Membership</strong>. This is our commitment to you, representing a significant value and ensuring you have full access to the ecosystem you're helping to build, at no cost, forever.</p>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><DollarSign className="h-6 w-6 text-primary"/>Benefit #1: Recurring Revenue Stream</CardTitle>
                    <CardDescription>Earn a stable, growing income from memberships.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>You earn a <strong className="text-primary">{isaMembershipShare}% share</strong> of all membership and subscription fees from every member you bring into the network. This is a recurring annuity for as long as they remain a member.</p>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary"/>Benefit #2: Transactional Revenue Share</CardTitle>
                    <CardDescription>Unlock high-upside potential from ecosystem activity.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>Your earning potential goes far beyond subscriptions. You earn a significant share of the revenue Logistics Flow generates from your network's activity across all our Malls.</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShoppingBasket className="h-6 w-6 text-primary" />Benefit #3: Earn from Value-Added Products</CardTitle>
                    <CardDescription>Generate recurring funds by selling essential services to your network.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>The Marketplace is a curated collection of high-demand, third-party products that we offer to our members. As an ISA, you sell these products to your network and earn a commission on every sale.</p>
                </CardContent>
            </Card>
        </div>
    );
}
