'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Gift, DollarSign, TrendingUp, Handshake, CheckCircle, ShoppingBasket, Award, Sparkles, Video, ShieldCheck } from 'lucide-react';
import React from 'react';
import { useConfig } from '@/hooks/use-config';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function AssociateOffer() {
    const { data: isaConfig, isLoading: isIsaLoading } = useConfig<any>('isaPitch');
    const { data: mallCommissions } = useConfig<any>('mallCommissions');

    if (isIsaLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    const exampleMembershipFee = 500;
    const exampleDealSize = 400000;
    const exampleOriginationFeePercent = 1;

    const isaMembershipShare = isaConfig?.membershipCommission || 30;
    const isaFinanceShare = isaConfig?.financeMallCommission || 20;
    const isaSupplierShare = isaConfig?.supplierMallCommission || 20;
    const isaMarketplaceShare = isaConfig?.marketplaceCommission || 50;
    
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
        <div className="space-y-8 text-left text-foreground">
            <div className="text-left">
                <h1 className="text-3xl font-bold font-headline text-left">The Digital Associate Offer</h1>
                <p className="text-lg text-muted-foreground mt-2 text-left">Monetize your audience and influence. Use our advanced AI studio to create content and earn recurring revenue.</p>
            </div>

            <Card className="border-primary border-2 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Sparkles className="h-6 w-6 text-primary"/>The Core Value: Creative Power</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg leading-relaxed">
                        As a Digital Associate, you gain <strong className="text-primary">Free Lifetime Access</strong> to our AI Content Studio. Generate 4K industrial videos, high-fidelity marketing images, and conversion-optimized copy instantly to monetize your network.
                    </p>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-8 text-left">
                <Card className="flex flex-col text-left">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-left"><DollarSign className="h-6 w-6 text-primary"/>Benefit #1: Recurring Revenue Stream</CardTitle>
                        <CardDescription className="text-left">Earn a stable, growing income from memberships.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-grow text-left">
                        <p className="text-sm">You earn a base commission of <strong className="text-primary">{isaMembershipShare}%</strong> on all monthly membership fees from every member you refer. This is a recurring annuity.</p>
                        
                         <div className="p-4 border rounded-lg bg-slate-50 text-left">
                            <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-3">Projected Annual Annuity</h4>
                             <Table>
                                <TableHeader><TableRow><TableHead className="text-[10px] uppercase">Network Size</TableHead><TableHead className="text-right text-[10px] uppercase">Income</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {potentialEarnings.map((tier: any, index: number) => (
                                        <TableRow key={index}>
                                            <TableCell className="text-sm font-medium">{tier.members} Members</TableCell>
                                            <TableCell className="text-right font-bold text-green-600">{formatCurrency(tier.annualRecurring)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
                 <Card className="flex flex-col text-left">
                    <CardHeader className="text-left">
                        <CardTitle className="flex items-center gap-2 text-left"><TrendingUp className="h-6 w-6 text-primary"/>Benefit #2: Transactional Revenue Share</CardTitle>
                         <CardDescription className="text-left">Unlock high-upside potential from ecosystem activity.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-grow text-left">
                        <p className="text-sm">Participate in platform revenue whenever your network members buy tires, parts, or access finance through our Malls.</p>
                        <ul className="text-xs space-y-3 pt-2 text-left">
                            <li className="flex items-start gap-3 text-left">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                <div>
                                    <strong className="font-semibold text-left">Finance Mall:</strong> A member finances a <strong className="font-mono">{formatCurrency(exampleDealSize)}</strong> trailer. You earn <strong className="text-green-600">{formatCurrency(isaExampleDealShare)}</strong>.
                                </div>
                            </li>
                             <li className="flex items-start gap-3 text-left">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                <div>
                                    <strong className="font-semibold text-left">Supplier Mall:</strong> Your network spends on spares. You earn a <strong className="text-green-600">{isaSupplierShare}% share</strong> of the platform commission.
                                </div>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>

            <Card className="text-left">
                <CardHeader className="text-left">
                    <CardTitle className="flex items-center gap-2 text-left"><ShoppingBasket className="h-6 w-6 text-primary" />Benefit #3: Earn from Value-Added Products</CardTitle>
                    <CardDescription className="text-left">Generate recurring funds by selling essential services to your network.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-left">
                    <p className="text-sm">The Marketplace allows you to resell high-demand third-party products like RAF Assist or specialized liability cover for direct <strong className="text-primary">{isaMarketplaceShare}% commission splits</strong>.</p>
                </CardContent>
                <CardFooter className="bg-muted/10 border-t p-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary">
                        <ShieldCheck className="h-4 w-4" /> Fully tracked nodes for guaranteed commission integrity.
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
