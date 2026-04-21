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

    const networkCommission = salesIncentives?.networkBaseCommission || 10;
    const supplierMallCommission = mallCommissions?.supplierMall || 2.5;

    // Example Scenario
    const referredClients = 20;
    const avgSpendPerClient = 5000;
    const totalNetworkSpend = referredClients * avgSpendPerClient;
    const platformEarnings = totalNetworkSpend * (supplierMallCommission / 100);
    const yourCommission = platformEarnings * (networkCommission / 100);

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
                <CardContent className="space-y-4">
                    <p>When you onboard your existing clients to Logistics Flow (so they can manage their own operations, find loads, or buy from other vendors), you earn a <strong className="text-primary">{networkCommission}% share</strong> of the commission we generate from their activity across the *entire* platform.</p>
                     <div className="p-4 border rounded-lg bg-background">
                        <h4 className="font-semibold flex items-center gap-2 mb-2"><DollarSign className="h-5 w-5 text-amber-500" />Example Earning Scenario</h4>
                        <p className="text-sm text-muted-foreground">Imagine you refer <strong className="text-foreground">{referredClients}</strong> of your clients to the platform. Over a month, they collectively spend <strong className="text-foreground">{formatCurrency(totalNetworkSpend)}</strong> on parts and services from other vendors in the mall.</p>
                        <Table className="mt-2">
                           <TableBody>
                               <TableRow>
                                    <TableCell>Platform commission from their spend ({supplierMallCommission}%)</TableCell>
                                    <TableCell className="text-right font-semibold">{formatCurrency(platformEarnings)}</TableCell>
                                </TableRow>
                                <TableRow className="bg-primary/10">
                                    <TableCell className="font-bold">Your {networkCommission}% Share (Monthly Commission)</TableCell>
                                    <TableCell className="text-right font-bold text-lg text-primary">{formatCurrency(yourCommission)}</TableCell>
                                </TableRow>
                           </TableBody>
                        </Table>
                         <p className="text-xs text-muted-foreground mt-2">This is passive income earned from your network's activity, even when they aren't buying from you.</p>
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
