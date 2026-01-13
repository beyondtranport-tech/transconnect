'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Gift, DollarSign, TrendingUp, Handshake, CheckCircle, ShoppingBasket } from 'lucide-react';
import React from 'react';
import { useConfig } from '@/hooks/use-config';
import { Loader2 } from 'lucide-react';

const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(amount);
};


export default function PitchContent() {
    const { data: isaOffer, isLoading } = useConfig<any>('isaPitch');

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    const membershipFee = 500; // This is an example, not from config
    const isaSharePercentage = isaOffer?.membershipCommission || 30;
    const exampleDealSize = isaOffer?.exampleDealSize || 400000;
    const exampleOriginationFee = isaOffer?.exampleOriginationFee || 1;
    const isaExampleDealSharePercentage = isaOffer?.financeMallCommission || 20;

    const annualSubscriptionRevenue = membershipFee * 12;
    const isaAnnualSubscriptionShare = annualSubscriptionRevenue * (isaSharePercentage / 100);
    const exampleDealCommission = exampleDealSize * (exampleOriginationFee / 100);
    const isaExampleDealShare = exampleDealCommission * (isaExampleDealSharePercentage / 100);
    
    const potentialEarnings = [
        { members: 10, annualRecurring: 10 * isaAnnualSubscriptionShare, potentialTransactional: 10 * isaExampleDealShare },
        { members: 50, annualRecurring: 50 * isaAnnualSubscriptionShare, potentialTransactional: 50 * isaExampleDealShare },
        { members: 100, annualRecurring: 100 * isaAnnualSubscriptionShare, potentialTransactional: 100 * isaExampleDealShare },
    ];


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">The Independent Sales Agent (ISA) Partnership</h1>
                <p className="text-lg text-muted-foreground mt-2">This is our value proposition for foundational partners. It's more than a referral program; it's a true business partnership.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Gift className="h-6 w-6 text-primary"/>The Core Offer: A Foundation of Partnership</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg">As a founding ISA partner, you receive a <strong className="text-primary">Free Lifetime Premium Membership</strong>. This is our commitment to you, representing a significant value and ensuring you have full access to the ecosystem you're helping to build, at no cost, forever.</p>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><DollarSign className="h-6 w-6 text-primary"/>Benefit #1: Recurring Revenue Stream</CardTitle>
                        <CardDescription>Earn a stable, growing income from memberships.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>You earn a <strong className="text-primary">{isaSharePercentage}% share</strong> of all membership and subscription fees from every member you bring into the network. This isn't a one-time payment; it's a recurring annuity for as long as they remain a member.</p>
                        <p>Assuming an average total monthly membership & subscription fee of <strong className="font-mono">{formatCurrency(membershipFee)}</strong>, your annual earning per member is <strong className="font-mono text-primary">{formatCurrency(isaAnnualSubscriptionShare)}</strong>.</p>
                        <Table>
                            <TableHeader><TableRow><TableHead>Network Size</TableHead><TableHead className="text-right">Potential Annual Recurring Income</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {potentialEarnings.map(item => (
                                    <TableRow key={item.members}>
                                        <TableCell>{item.members} Members</TableCell>
                                        <TableCell className="text-right font-bold text-primary">{formatCurrency(item.annualRecurring)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary"/>Benefit #2: Transactional Revenue Share</CardTitle>
                         <CardDescription>Unlock high-upside potential from ecosystem activity.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>Your earning potential goes far beyond subscriptions. You earn a significant share of the revenue TransConnect generates from your network's activity across all our Malls.</p>
                        <ul className="text-sm space-y-4 pt-2">
                            <li className="flex items-start gap-3">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-1 shrink-0" />
                                <div>
                                    <strong className="font-semibold">Finance Mall:</strong> A member from your network finances a <strong className="font-mono">{formatCurrency(exampleDealSize)}</strong> trailer. TransConnect earns a {exampleOriginationFee}% fee ({formatCurrency(exampleDealCommission)}). Your {isaExampleDealSharePercentage}% share earns you <strong className="text-green-600">{formatCurrency(isaExampleDealShare)}</strong>.
                                </div>
                            </li>
                             <li className="flex items-start gap-3">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-1 shrink-0" />
                                <div>
                                    <strong className="font-semibold">Supplier Mall:</strong> Your network collectively spends R50,000 on parts. TransConnect earns a 2.5% commission (R1,250). Your {isaOffer?.supplierMallCommission || 20}% share could earn you <strong className="text-green-600">{formatCurrency(1250 * ((isaOffer?.supplierMallCommission || 20) / 100))}</strong> from that activity alone.
                                </div>
                            </li>
                             <li className="flex items-start gap-3">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-1 shrink-0" />
                                <div>
                                    <strong className="font-semibold">Buy & Sell Mall:</strong> A member sells a used truck for R250,000. TransConnect earns a 1% success fee (R2,500). Your {isaOffer?.buySellMallCommission || 20}% share nets you <strong className="text-green-600">{formatCurrency(2500 * ((isaOffer?.buySellMallCommission || 20) / 100))}</strong>.
                                </div>
                            </li>
                        </ul>
                         <p className="text-sm text-muted-foreground pt-4 border-t">This model applies across all malls. Your income grows exponentially as your network's activity on the platform grows.</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShoppingBasket className="h-6 w-6 text-primary" />Benefit #3: Earn from Value-Added Products</CardTitle>
                    <CardDescription>Generate recurring funds by selling essential services to your network.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>The Marketplace is a curated collection of high-demand, third-party products that we offer to our members, often at a discount. As an ISA, you sell these products to your network and earn a commission on every sale.</p>
                     <ul className="text-sm space-y-4 pt-2">
                        <li className="flex items-start gap-3">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-1 shrink-0" />
                            <div>
                                <strong className="font-semibold">Example: Subscription Product Sales.</strong> A subscription product costs R40/month. TransConnect earns a R10 (25%) commission. We share {isaOffer?.marketplaceCommission || 50}% of our commission with you, the ISA.
                            </div>
                        </li>
                         <li className="flex items-start gap-3">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-1 shrink-0" />
                            <div>
                                <strong className="font-semibold">The Model in Action:</strong> If you sell 20 products a month, by the end of the year you will have 240 active subscriptions. This generates <strong className="text-green-600">{formatCurrency(240 * 10 * ((isaOffer?.marketplaceCommission || 50)/100))} per month</strong> in passive, recurring income for you.
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-1 shrink-0" />
                            <div>
                                <strong className="font-semibold">Expand Your Portfolio:</strong> This applies to products like RAF Assist, Open Loyalty Funeral/Roadside Assist, specialized liability cover, and more. Each product you sell adds another layer to your income.
                            </div>
                        </li>
                    </ul>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Handshake className="h-6 w-6 text-primary"/>How It Works: A Simple 3-Step Partnership</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h4 className="font-bold text-lg">Step 1: We Empower You</h4>
                        <p className="text-muted-foreground">We provide you with your lifetime premium membership, a unique referral code, and access to your personal ISA dashboard to track sign-ups, activity, and earnings in real-time.</p>
                    </div>
                     <div>
                        <h4 className="font-bold text-lg">Step 2: You Activate Your Network</h4>
                        <p className="text-muted-foreground">You introduce TransConnect to your community. Your pitch is simple: invite them to join an ecosystem that saves them money, helps them find work, and gives them access to better financing. We equip you with offers and materials to make signing up irresistible.</p>
                    </div>
                     <div>
                        <h4 className="font-bold text-lg">Step 3: You Earn Automatically</h4>
                        <p className="text-muted-foreground">Every time a member from your network pays a subscription, completes a transaction, or buys a product, your share is automatically calculated and credited to your wallet. It's a transparent, seamless process designed for your success.</p>
                    </div>
                </CardContent>
                <CardFooter>
                    <p className="text-lg font-semibold">We succeed when our partners and members succeed. This is a true win-win-win model.</p>
                </CardFooter>
            </Card>
        </div>
    );
}
