'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Gift, DollarSign, TrendingUp, Handshake, CheckCircle, ShoppingBasket, Award, Network } from 'lucide-react';
import React from 'react';
import { useConfig } from '@/hooks/use-config';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function RevenueModel({ partner }: { partner?: any }) {
    const recipientName = partner?.firstName || 'Partner';
    const companyName = partner?.companyName || 'your business';

    const { data: isaConfig, isLoading } = useConfig<any>('isaPitch');
    const { data: mallCommissions } = useConfig<any>('mallCommissions');

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    const exampleMembershipFee = 500;
    const exampleDealSize = 400000;
    const exampleOriginationFeePercent = 1;
    const exampleSupplierSpend = 50000;
    
    const networkMembershipShare = isaConfig?.membershipCommission || 10;
    const networkTransactionalShare = isaConfig?.financeMallCommission || 10;
    const supplierMallPlatformCommission = (mallCommissions?.supplierMall || 2.5) / 100;
    
    const annualSubscriptionRevenue = exampleMembershipFee * 12;
    const networkAnnualSubscriptionShare = annualSubscriptionRevenue * (networkMembershipShare / 100);

    const exampleDealCommission = exampleDealSize * (exampleOriginationFeePercent / 100);
    const networkExampleDealShare = exampleDealCommission * (networkTransactionalShare / 100);

    const supplierPlatformEarnings = exampleSupplierSpend * supplierMallPlatformCommission;
    const networkSupplierEarnings = supplierPlatformEarnings * (networkTransactionalShare / 100);

    return (
        <div className="space-y-8">
            <CardHeader className="px-0 text-center">
                 <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                    <Network className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold font-headline">Revenue Generation Model for {recipientName}</CardTitle>
                <CardDescription className="text-lg text-muted-foreground mt-2">How {companyName} can turn industry relationships into a passive revenue engine.</CardDescription>
            </CardHeader>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">Step 1: Onboard Your Network</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg text-muted-foreground">{recipientName}, your most valuable asset is the network you've built. By inviting your contacts to join Logistics Flow through your unique link, they are automatically tagged as your referrals. We handle the systems; you simply share the benefits of the community.</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">Step 2: Earn from Every Transaction</CardTitle>
                    <CardDescription>
                        You earn a commission on nearly every financial movement your network makes across the entire ecosystem.
                    </CardDescription>
                </CardHeader>
                 <CardContent className="space-y-6 pt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-4 border rounded-lg bg-background shadow-sm">
                            <h4 className="font-semibold flex items-center gap-2"><TrendingUp/>Annuity Membership Share</h4>
                            <p className="text-sm mt-2 text-muted-foreground">Receive a <strong className="text-primary">{networkMembershipShare}% share</strong> of all membership fees paid by {companyName}'s referrals. This is a monthly recurring income that scales as you grow your list.</p>
                        </div>
                        <div className="p-4 border rounded-lg bg-background shadow-sm">
                            <h4 className="font-semibold flex items-center gap-2"><DollarSign/>Transactional Commission</h4>
                            <p className="text-sm mt-2 text-muted-foreground">Get a <strong className="text-primary">{networkTransactionalShare}% share</strong> of the platform's commission whenever your network members buy parts, tires, or access finance.</p>
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold text-muted-foreground mb-4">Potential Scenarios for {companyName}:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-md">
                            <p><strong className="text-foreground">Finance Mall:</strong> A referral finances a <strong className="font-mono">{formatCurrency(exampleDealSize)}</strong> asset. The platform earns a {exampleOriginationFeePercent}% fee. Your share: <strong className="text-green-600 font-bold">{formatCurrency(networkExampleDealShare)}</strong>.</p>
                            <p><strong className="text-foreground">Supplier Mall:</strong> Your referrals spend {formatCurrency(exampleSupplierSpend)} on parts. The platform earns a {supplierMallPlatformCommission*100}% commission. Your share: <strong className="text-green-600 font-bold">{formatCurrency(networkSupplierEarnings)}</strong>.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-primary/50 bg-primary/5">
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <Handshake className="h-6 w-6" />
                        Transparency and Data Privacy
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        At Logistics Flow, we guarantee that {companyName}'s customer list and business contacts remain your property. We provide the mechanism to monetize these relationships without ever exposing your data to third parties. Our model is built on mutual trust and the collective growth of the logistics ecosystem.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
