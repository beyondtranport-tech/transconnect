'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Store, Banknote, Handshake, CheckCircle, TrendingUp, DollarSign, ShieldCheck, Loader2 } from "lucide-react";
import React from 'react';
import { useConfig } from '@/hooks/use-config';
import { formatCurrency } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ArrowRight } from "lucide-react";


export default function SupplierOffer() {
    const { data: salesIncentives, isLoading: incentivesLoading } = useConfig<any>('salesIncentives');
    const { data: mallCommissions, isLoading: commissionsLoading } = useConfig<any>('mallCommissions');
    
    const isLoading = incentivesLoading || commissionsLoading;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    // User request: Change recurring revenue share to 30%
    const membershipCommissionShare = 30;
    
    // Use sales incentives for transactional share, or default
    const transactionalCommissionShare = salesIncentives?.networkBaseCommission || 10;
    
    const supplierMallCommission = mallCommissions?.supplierMall || 2.5;

    // --- Example Scenario Data ---
    const exampleMembershipFee = 500;
    const exampleDealSize = 400000;
    // User request: change fee to 2.5%
    const exampleOriginationFeePercent = 2.5; 
    const exampleSupplierSpend = 50000;

    // --- Calculations ---
    const annualSubscriptionRevenue = exampleMembershipFee * 12;
    const yourAnnualSubscriptionShare = annualSubscriptionRevenue * (membershipCommissionShare / 100);

    const exampleDealCommission = exampleDealSize * (exampleOriginationFeePercent / 100);
    const yourFinanceDealShare = exampleDealCommission * (transactionalCommissionShare / 100);

    const supplierPlatformEarnings = exampleSupplierSpend * (supplierMallCommission / 100);
    const yourSupplierDealShare = supplierPlatformEarnings * (transactionalCommissionShare / 100);
    
    const potentialEarnings = [
        { members: 10, annualRecurring: 10 * yourAnnualSubscriptionShare },
        { members: 50, annualRecurring: 50 * yourAnnualSubscriptionShare },
        { members: 100, annualRecurring: 100 * yourAnnualSubscriptionShare },
    ];


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">The Supplier Partnership Offer</h1>
                <p className="text-lg text-muted-foreground mt-2">
                    Transform your business from just a vendor into a revenue-generating partner in the Logistics Flow ecosystem.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <Store className="h-6 w-6 text-primary" />
                            Your Digital Sales Channel
                        </CardTitle>
                        <CardDescription>Establish a powerful online presence and connect directly with your target market.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-3">
                         <li className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                            <span>Create a professional shop in our Supplier Mall to showcase your products to a captive audience of transport operators.</span>
                        </li>
                        <li className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                            <span>Receive quote requests, manage orders, and get paid faster through our integrated wallet system.</span>
                        </li>
                    </CardContent>
                </Card>

                 <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <Banknote className="h-6 w-6 text-primary" />
                            Embedded Finance: Close More Deals
                        </CardTitle>
                         <CardDescription>Never lose a sale due to a customer's cash flow problems again.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-3">
                         <li className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                            <span>Our members can get instant credit at checkout to purchase from your store.</span>
                        </li>
                         <li className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                            <span>You get paid upfront and in full. We handle the financing and risk for the buyer, ensuring you never carry the debt.</span>
                        </li>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-2 border-primary">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <TrendingUp className="h-6 w-6 text-primary"/>
                        The Core Opportunity: Monetize Your Network
                    </CardTitle>
                    <CardDescription>
                        Your most valuable asset isn't just what you sell—it's who you sell to. Our partnership model allows you to earn recurring revenue from the business relationships you already have.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h4 className="font-semibold text-lg">Benefit #1: Recurring Revenue from Memberships</h4>
                        <p className="text-muted-foreground mt-2">
                             You earn a <strong className="text-primary">{membershipCommissionShare}% share</strong> of all membership fees from every member you bring into the network. This is a recurring annuity income that grows with your network.
                        </p>
                        <div className="p-4 border rounded-lg bg-background mt-4">
                            <h5 className="font-semibold mb-2">Example: Annual Recurring Income</h5>
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
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold text-lg">Benefit #2: Transactional Revenue from Network Activity</h4>
                        <p className="text-muted-foreground mt-2">
                            You get a <strong className="text-primary">{transactionalCommissionShare}% share</strong> of the platform's commission when your network members transact in any mall—even when they aren't buying from you.
                        </p>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4">
                             <div className="p-4 border rounded-lg bg-background">
                                <strong className="text-foreground flex items-center gap-2 mb-2"><DollarSign className="h-5 w-5"/>Finance Mall Example:</strong>
                                A member from your network finances a <strong className="font-mono">{formatCurrency(exampleDealSize)}</strong> truck. The platform earns a {exampleOriginationFeePercent}% fee ({formatCurrency(exampleDealCommission)}). Your {transactionalCommissionShare}% share earns you <strong className="text-green-600">{formatCurrency(yourFinanceDealShare)}</strong>.
                             </div>
                             <div className="p-4 border rounded-lg bg-background">
                                <strong className="text-foreground flex items-center gap-2 mb-2"><Handshake className="h-5 w-5"/>Supplier Mall Example:</strong>
                                Your referred members spend {formatCurrency(exampleSupplierSpend)} on parts from *other* vendors. The platform earns a {supplierMallCommission}% commission ({formatCurrency(supplierPlatformEarnings)}). Your {transactionalCommissionShare}% share could earn you <strong className="text-green-600">{formatCurrency(yourSupplierDealShare)}</strong>.
                             </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-destructive">
                        <ShieldCheck className="h-6 w-6 text-destructive" />
                        Your Network Stays Yours. Period.
                    </CardTitle>
                </CardHeader>
                 <CardContent>
                    <p className="text-lg text-muted-foreground">
                        We guarantee that your client list and business relationships are confidential. Your data will **never** be shared with or exposed to your competitors on the platform. Our model is built on trust and mutual growth, not on cannibalizing your customer base.
                    </p>
                </CardContent>
            </Card>
            
            <div className="text-center pt-8">
                 <Button asChild size="lg">
                    <Link href="/account?view=shop">
                        Start Building Your Shop & Network <ArrowRight className="ml-2 h-4 w-4"/>
                    </Link>
                </Button>
            </div>
        </div>
    );
}
