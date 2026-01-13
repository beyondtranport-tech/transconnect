
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Gift, DollarSign, TrendingUp, Handshake, CheckCircle } from 'lucide-react';
import React from 'react';

const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(amount);
};

const IsaOffer = {
    membershipFee: 500,
    isaSharePercentage: 30,
    exampleDealSize: 400000,
    exampleOriginationFee: 1,
    exampleIsaDealShare: 20,
};

const annualSubscriptionRevenue = IsaOffer.membershipFee * 12;
const isaAnnualSubscriptionShare = annualSubscriptionRevenue * (IsaOffer.isaSharePercentage / 100);
const exampleDealCommission = IsaOffer.exampleDealSize * (IsaOffer.exampleOriginationFee / 100);
const isaExampleDealShare = exampleDealCommission * (IsaOffer.exampleIsaDealShare / 100);

const potentialEarnings = [
    { members: 10, annualRecurring: 10 * isaAnnualSubscriptionShare, potentialTransactional: 10 * isaExampleDealShare },
    { members: 50, annualRecurring: 50 * isaAnnualSubscriptionShare, potentialTransactional: 50 * isaExampleDealShare },
    { members: 100, annualRecurring: 100 * isaAnnualSubscriptionShare, potentialTransactional: 100 * isaExampleDealShare },
];

export default function PitchContent() {
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
                    <p className="text-lg">As a founding ISA partner, you receive a <strong className="text-primary">Free Lifetime Premium Membership</strong>. This is our commitment to you, representing a significant value (e.g., over R60,000 over 10 years) and ensuring you have full access to the ecosystem you're helping to build, at no cost, forever.</p>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><DollarSign className="h-6 w-6 text-primary"/>Benefit #1: Recurring Revenue Stream</CardTitle>
                        <CardDescription>Earn a stable, growing income from memberships.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>You earn a <strong className="text-primary">{IsaOffer.isaSharePercentage}% share</strong> of all membership and subscription fees from every member you bring into the network. This isn't a one-time payment; it's a recurring annuity for as long as they remain a member.</p>
                        <p>Assuming a total monthly membership & subscription fee of <strong className="font-mono">{formatCurrency(IsaOffer.membershipFee)}</strong>, your annual earning per member is <strong className="font-mono text-primary">{formatCurrency(isaAnnualSubscriptionShare)}</strong>.</p>
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
                        <p>
                            <strong>Example:</strong> A member from your network finances a <strong className="font-mono">{formatCurrency(IsaOffer.exampleDealSize)}</strong> trailer through our Finance Mall.
                        </p>
                        <ul className="text-sm space-y-2 pl-4">
                            <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary mt-1 shrink-0" /><span>TransConnect earns a <strong className="font-semibold">{IsaOffer.exampleOriginationFee}% origination fee</strong>: {formatCurrency(exampleDealCommission)}.</span></li>
                            <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary mt-1 shrink-0" /><span>As their ISA, you earn a <strong className="font-semibold">{IsaOffer.exampleIsaDealShare}% share</strong> of that fee.</span></li>
                            <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-600 mt-1 shrink-0" /><strong className="text-green-600">Your commission from this single deal: {formatCurrency(isaExampleDealShare)}.</strong></li>
                        </ul>
                         <p className="text-sm text-muted-foreground pt-4 border-t">This model applies to commissions earned in the Supplier Mall, transaction fees in the Buy & Sell Mall, and more. Your income grows as your network's activity on the platform grows.</p>
                    </CardContent>
                </Card>
            </div>

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
                        <p className="text-muted-foreground">You introduce TransConnect to your community. Your pitch is simple: invite them to join an ecosystem that saves them money on parts, helps them find work, and gives them access to better financing. We can even equip you with a limited-time "First Year Free" offer to make signing up irresistible.</p>
                    </div>
                     <div>
                        <h4 className="font-bold text-lg">Step 3: You Earn Automatically</h4>
                        <p className="text-muted-foreground">Every time a member from your network pays a subscription or completes a transaction in the mall, your share is automatically calculated and credited to your wallet. It's a transparent, seamless process.</p>
                    </div>
                </CardContent>
                <CardFooter>
                    <p className="text-lg font-semibold">We succeed when our partners and members succeed. This is a true win-win-win model.</p>
                </CardFooter>
            </Card>
        </div>
    );
}
