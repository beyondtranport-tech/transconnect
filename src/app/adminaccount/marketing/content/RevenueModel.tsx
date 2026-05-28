'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Handshake, Network, Ship, Truck } from 'lucide-react';
import React, { useMemo } from 'react';
import { useConfig } from '@/hooks/use-config';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

/**
 * Tailored Revenue Model
 * Shows different monetization scenarios based on the single-word industry tag.
 */
export default function RevenueModel({ partner }: { partner?: any }) {
    const recipientName = partner?.firstName || 'Partner';
    const companyName = partner?.companyName || 'your business';
    const industryTag = partner?.entryType || 'General';

    const isForwarder = industryTag === 'Forwarder';

    const { data: isaConfig, isLoading } = useConfig<any>('isaPitch');
    const { data: mallCommissions } = useConfig<any>('mallCommissions');

    const scenarioText = useMemo(() => {
        if (isForwarder) {
            return {
                title: "The Forwarder Scenario",
                icon: Ship,
                description: "Onboard your haulier network. When you appoint them for a load, their membership and activity contribute to your revenue share."
            };
        }
        return {
            title: "The Haulier Scenario",
            icon: Truck,
            description: "Onboard your fellow transporters. As they find loads and save on tires, you earn a recurring share of the ecosystem value."
        };
    }, [isForwarder]);

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
            
            <Card className="border-l-4 border-l-amber-500 bg-amber-50/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {React.createElement(scenarioText.icon, { className: "h-5 w-5 text-amber-600" })}
                        {scenarioText.title}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-amber-900">{scenarioText.description}</p>
                </CardContent>
            </Card>

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
                            <h4 className="font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary"/>Annuity Membership Share</h4>
                            <p className="text-sm mt-2 text-muted-foreground">Receive a <strong className="text-primary">{networkMembershipShare}% share</strong> of all membership fees paid by {companyName}'s referrals. This is a monthly recurring income.</p>
                        </div>
                        <div className="p-4 border rounded-lg bg-background shadow-sm">
                            <h4 className="font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary"/>Transactional Commission</h4>
                            <p className="text-sm mt-2 text-muted-foreground">Get a <strong className="text-primary">{networkTransactionalShare}% share</strong> of the platform's commission whenever your network members buy parts or access finance.</p>
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold text-muted-foreground mb-4">Calculated Scenario for {companyName}:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-muted/30 p-4 rounded-md font-mono">
                            <p><strong>Finance Mall:</strong> Deal of {formatCurrency(exampleDealSize)} results in a share of <strong className="text-green-600">{formatCurrency(networkExampleDealShare)}</strong> for you.</p>
                            <p><strong>Supplier Mall:</strong> Collective spend of {formatCurrency(exampleSupplierSpend)} results in a share of <strong className="text-green-600">{formatCurrency(networkSupplierEarnings)}</strong> for you.</p>
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
                    <p className="text-muted-foreground text-sm">
                        At Logistics Flow, we guarantee that {companyName}'s customer list and business contacts remain your property. We provide the mechanism to monetize these relationships without ever exposing your sensitive data to third parties.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
