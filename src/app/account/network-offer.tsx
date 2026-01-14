
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Gift, DollarSign, TrendingUp, Handshake, CheckCircle, ShoppingBasket, Target } from 'lucide-react';
import React from 'react';
import { useConfig } from '@/hooks/use-config';
import { Loader2 } from 'lucide-react';

const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(amount);
};

export default function NetworkOffer() {
    const { data: isaConfig, isLoading } = useConfig<any>('isaPitch');
    
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    // New, simplified incentive structure for network members
    const networkMembershipShare = 10;
    const networkTransactionalShare = 10;
    
    // Example figures for illustration purposes
    const exampleMembershipFee = 500;
    const exampleDealSize = 400000;
    const exampleOriginationFeePercent = 1;

    // Derived example calculations
    const annualSubscriptionRevenue = exampleMembershipFee * 12;
    const networkAnnualSubscriptionShare = annualSubscriptionRevenue * (networkMembershipShare / 100);

    const exampleDealCommission = exampleDealSize * (exampleOriginationFeePercent / 100);
    const networkExampleDealShare = exampleDealCommission * (networkTransactionalShare / 100);
    
    const potentialEarnings = [
        { members: 10, annualRecurring: 10 * networkAnnualSubscriptionShare },
        { members: 50, annualRecurring: 50 * networkAnnualSubscriptionShare },
        { members: 100, annualRecurring: 100 * networkAnnualSubscriptionShare },
    ];


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">The Network Offer</h1>
                <p className="text-lg text-muted-foreground mt-2">This is the value proposition for new members joining the TransConnect network. It's a pathway to savings, growth, and earning potential.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Gift className="h-6 w-6 text-primary"/>The Core Offer: A Foundation of Value</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg">As a member of TransConnect, you gain immediate access to an ecosystem designed to reduce your costs and increase your opportunities. This includes access to our Malls for funding, parts, and collaboration.</p>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><DollarSign className="h-6 w-6 text-primary"/>Incentive 1: Recurring Revenue</CardTitle>
                        <CardDescription>Activate the "Actions Plan" and start earning.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>By referring others, you earn a <strong className="text-primary">{networkMembershipShare}% share</strong> of all membership fees from every member you bring into the network. This is a recurring annuity income.</p>
                        <p>Assuming an average monthly membership fee of <strong className="font-mono">{formatCurrency(exampleMembershipFee)}</strong>, your potential annual earning per referred member is <strong className="font-mono text-primary">{formatCurrency(networkAnnualSubscriptionShare)}</strong>.</p>
                        <Table>
                            <TableHeader><TableRow><TableHead>Your Network Size</TableHead><TableHead className="text-right">Potential Annual Recurring Income</TableHead></TableRow></TableHeader>
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
                        <CardTitle className="flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary"/>Incentive 2: Transactional Revenue Share</CardTitle>
                         <CardDescription>Earn from the activity within your network.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>Your earning potential grows as your network uses the platform. You earn a <strong className="text-primary">{networkTransactionalShare}% share</strong> of the revenue TransConnect generates from your network's activity across the malls.</p>
                        <ul className="text-sm space-y-4 pt-2">
                            <li className="flex items-start gap-3">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-1 shrink-0" />
                                <div>
                                    <strong className="font-semibold">Finance Mall Example:</strong> A member from your network finances a <strong className="font-mono">{formatCurrency(exampleDealSize)}</strong> truck. TransConnect earns a {exampleOriginationFeePercent}% fee ({formatCurrency(exampleDealCommission)}). Your {networkTransactionalShare}% share earns you <strong className="text-green-600">{formatCurrency(networkExampleDealShare)}</strong>.
                                </div>
                            </li>
                             <li className="flex items-start gap-3">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-1 shrink-0" />
                                <div>
                                    This model applies to commissions earned in the Supplier Mall, Buy & Sell Mall, and Marketplace. Your income grows as your network grows.
                                </div>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Target className="h-6 w-6 text-primary"/>The Pathway to Partnership</CardTitle>
                     <CardDescription>Graduate from a network member to a full ISA Partner.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-lg">We believe in rewarding growth and commitment. If you can demonstrate a significant network base (a minimum of <strong className="text-primary">500 potential opportunities</strong>), you can apply to become a full Independent Sales Agent (ISA) Partner.</p>
                    <p className="text-muted-foreground">As a Partner, you unlock higher commission tiers, performance bonuses, and a closer working relationship with the TransConnect team. This is the ultimate level for those who want to turn referrals into a significant business.</p>
                </CardContent>
                 <CardFooter>
                    <p className="text-lg font-semibold">Start by building your network, and we'll provide the tools and rewards for your success.</p>
                </CardFooter>
            </Card>
        </div>
    );
}
