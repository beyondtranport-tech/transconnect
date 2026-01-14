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

export default function NetworkOffer() {
    const { data: isaConfig, isLoading } = useConfig<any>('isaPitch');
    const { data: mallCommissions } = useConfig<any>('mallCommissions');
    
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    // Example figures for illustration purposes
    const exampleMembershipFee = 500;
    const exampleDealSize = 400000;
    const exampleOriginationFeePercent = 1;

    // Dynamic rates from config
    const isaMembershipShare = isaConfig?.membershipCommission || 30;
    const isaFinanceShare = isaConfig?.financeMallCommission || 20;
    
    // Derived example calculations
    const annualSubscriptionRevenue = exampleMembershipFee * 12;
    const isaAnnualSubscriptionShare = annualSubscriptionRevenue * (isaMembershipShare / 100);

    const exampleDealCommission = exampleDealSize * (exampleOriginationFeePercent / 100);
    const isaExampleDealShare = exampleDealCommission * (isaFinanceShare / 100);
    
    const potentialEarnings = [
        { members: 10, annualRecurring: 10 * isaAnnualSubscriptionShare },
        { members: 50, annualRecurring: 50 * isaAnnualSubscriptionShare },
        { members: 100, annualRecurring: 100 * isaAnnualSubscriptionShare },
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
                        <CardTitle className="flex items-center gap-2"><DollarSign className="h-6 w-6 text-primary"/>Earning Potential: Recurring Revenue</CardTitle>
                        <CardDescription>Activate the "Actions Plan" and start earning.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>By becoming a partner and referring others, you earn a <strong className="text-primary">{isaMembershipShare}% share</strong> of all membership fees from every member you bring into the network. This is a recurring annuity income.</p>
                        <p>Assuming an average monthly membership fee of <strong className="font-mono">{formatCurrency(exampleMembershipFee)}</strong>, your potential annual earning per referred member is <strong className="font-mono text-primary">{formatCurrency(isaAnnualSubscriptionShare)}</strong>.</p>
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
                        <CardTitle className="flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary"/>Transactional Revenue Share</CardTitle>
                         <CardDescription>Earn from the activity within your network.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>Your earning potential grows as your network uses the platform. You earn a share of the revenue TransConnect generates from your network's activity across the malls.</p>
                        <ul className="text-sm space-y-4 pt-2">
                            <li className="flex items-start gap-3">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-1 shrink-0" />
                                <div>
                                    <strong className="font-semibold">Finance Mall Example:</strong> A member from your network finances a <strong className="font-mono">{formatCurrency(exampleDealSize)}</strong> truck. TransConnect earns a {exampleOriginationFeePercent}% fee ({formatCurrency(exampleDealCommission)}). Your {isaFinanceShare}% share earns you <strong className="text-green-600">{formatCurrency(isaExampleDealShare)}</strong>.
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
                    <CardTitle className="flex items-center gap-2"><Handshake className="h-6 w-6 text-primary"/>How It Works: A Simple Path to Partnership</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h4 className="font-bold text-lg">Step 1: Join as a Member</h4>
                        <p className="text-muted-foreground">First, become a member of TransConnect to experience the benefits of the ecosystem yourself.</p>
                    </div>
                     <div>
                        <h4 className="font-bold text-lg">Step 2: Activate Your Network</h4>
                        <p className="text-muted-foreground">Use the tools in your "My Network" dashboard to get your unique referral link and invite other businesses to join.</p>
                    </div>
                     <div>
                        <h4 className="font-bold text-lg">Step 3: Earn Automatically</h4>
                        <p className="text-muted-foreground">When a member you referred pays a fee or completes a transaction, your commission share is automatically calculated and credited to your wallet.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
