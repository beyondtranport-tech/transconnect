
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Gift, DollarSign, TrendingUp, Handshake, CheckCircle, ShoppingBasket, Award, Network } from 'lucide-react';
import React from 'react';
import { useConfig } from '@/hooks/use-config';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function RevenueModel() {
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
    
    // Dynamic rates from config
    const networkMembershipShare = isaConfig?.membershipCommission || 10; // Using isa as a proxy, this can be its own config
    const networkTransactionalShare = isaConfig?.financeMallCommission || 10;
    const supplierMallPlatformCommission = (mallCommissions?.supplierMall || 2.5) / 100;
    
    // Derived example calculations
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
                <CardTitle className="text-3xl font-bold font-headline">The Supplier Revenue Model</CardTitle>
                <CardDescription className="text-lg text-muted-foreground mt-2">Turn Your Customer Base into a Passive Revenue Engine.</CardDescription>
            </CardHeader>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">Step 1: Create Your Network</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg text-muted-foreground">Your most valuable asset is your existing customer base. By inviting your customers to join Logistics Flow (for free), you onboard them into your digital network. Our platform handles the tracking; you simply share the benefits of the ecosystem with them.</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">Step 2: Earn from Network Activity</CardTitle>
                    <CardDescription>
                        You earn a commission on nearly every transaction your network makes across the <span className="font-semibold text-foreground">entire Logistics Flow ecosystem</span>, even when they aren't buying from you.
                    </CardDescription>
                </CardHeader>
                 <CardContent className="space-y-6 pt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-4 border rounded-lg bg-background">
                            <h4 className="font-semibold flex items-center gap-2"><TrendingUp/>Recurring Membership Revenue</h4>
                            <p className="text-sm mt-2 text-muted-foreground">You receive a <strong className="text-primary">{networkMembershipShare}% share</strong> of all membership fees paid by the clients you onboard. For every 100 members paying an average of R500/mo, that's a potential <strong className="text-primary">{formatCurrency(100 * (500*12) * (networkMembershipShare/100))} per year</strong> in passive income.</p>
                        </div>
                        <div className="p-4 border rounded-lg bg-background">
                            <h4 className="font-semibold flex items-center gap-2"><DollarSign/>Transactional Revenue Share</h4>
                            <p className="text-sm mt-2 text-muted-foreground">You get a <strong className="text-primary">{networkTransactionalShare}% share</strong> of the platform's commission when your network members transact in any mall.</p>
                        </div>
                    </div>
                     <div>
                        <h4 className="text-center font-semibold text-muted-foreground mb-4">Example Scenarios:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <p><strong className="text-foreground">Finance Mall:</strong> One of your referred members finances a <strong className="font-mono">{formatCurrency(exampleDealSize)}</strong> truck. The platform earns a {exampleOriginationFeePercent}% fee ({formatCurrency(exampleDealCommission)}). Your share earns you <strong className="text-green-600">{formatCurrency(networkExampleDealShare)}</strong>.</p>
                            <p><strong className="text-foreground">Supplier Mall:</strong> Your referred members spend a collective {formatCurrency(exampleSupplierSpend)} on parts from <strong className="italic">other vendors</strong>. The platform earns a {supplierMallPlatformCommission*100}% commission ({formatCurrency(supplierPlatformEarnings)}). Your share could earn you <strong className="text-green-600">{formatCurrency(networkSupplierEarnings)}</strong>.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-destructive/50">
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <Handshake className="h-6 w-6" />
                        A Note on Trust and Privacy
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg">We want to be clear: this is a partnership, not a data grab. Your customer list is <strong className="text-foreground">never exposed to other suppliers</strong>. The network mechanism is built on trust. Your reward comes from the overall value your network brings to the ecosystem, creating a true win-win scenario.</p>
                </CardContent>
            </Card>
        </div>
    );
}
