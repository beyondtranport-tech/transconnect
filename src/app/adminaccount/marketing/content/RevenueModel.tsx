'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Gift, DollarSign, TrendingUp, Handshake, CheckCircle, ShoppingBasket, Award } from 'lucide-react';
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
    const exampleTruckSale = 250000;
    
    // Dynamic rates from config
    const isaMembershipShare = isaConfig?.membershipCommission || 30;
    const isaFinanceShare = isaConfig?.financeMallCommission || 20;
    const isaSupplierShare = isaConfig?.supplierMallCommission || 20;
    const isaBuySellShare = isaConfig?.buySellMallCommission || 20;
    
    // Derived example calculations
    const annualSubscriptionRevenue = exampleMembershipFee * 12;
    const isaAnnualSubscriptionShare = annualSubscriptionRevenue * (isaMembershipShare / 100);

    const exampleDealCommission = exampleDealSize * (exampleOriginationFeePercent / 100);
    const isaExampleDealShare = exampleDealCommission * (isaFinanceShare / 100);
    
    const supplierMallPlatformCommission = (mallCommissions?.supplierMall || 2.5) / 100;
    const supplierPlatformEarnings = exampleSupplierSpend * supplierMallPlatformCommission;
    
    const buySellMallPlatformCommission = (mallCommissions?.buySellMall || 1) / 100;
    const buySellPlatformEarnings = exampleTruckSale * buySellMallPlatformCommission;


    return (
        <div className="space-y-8">
            <CardHeader className="px-0">
                <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-6 w-6" />
                    Platform Revenue Model
                </CardTitle>
                <CardDescription>Logistics Flow generates revenue through three primary streams, creating a diversified and robust financial model. Partners and ISAs share in this revenue.</CardDescription>
            </CardHeader>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Stream 1: Recurring Membership Fees
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Members subscribe to tiered plans (e.g., Basic, Standard, Premium) to access advanced features like unlimited product listings, AI marketing tools, and priority support. This provides a stable, predictable base of recurring revenue.
                    </p>
                    <div className="mt-4 p-4 border rounded-lg bg-background">
                        <h4 className="font-semibold">Example Calculation:</h4>
                        <p className="text-sm text-muted-foreground mt-1">Assuming an average membership fee of <span className="font-mono">{formatCurrency(exampleMembershipFee)}</span>/month, each member generates <span className="font-mono">{formatCurrency(annualSubscriptionRevenue)}</span> in annual recurring revenue (ARR).
                        </p>
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Handshake className="h-5 w-5 text-primary" />
                        Stream 2: Transactional Mall Commissions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                       The platform earns a small commission on successful transactions that occur within our specialized malls. This revenue is directly tied to the economic activity and value generated within the ecosystem.
                    </p>
                    <div className="mt-4 space-y-4">
                        <div className="p-4 border rounded-lg bg-background">
                            <h4 className="font-semibold">Finance Mall:</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                                On a <span className="font-mono">{formatCurrency(exampleDealSize)}</span> asset finance deal, a {exampleOriginationFeePercent}% origination fee results in <span className="font-mono text-primary">{formatCurrency(exampleDealCommission)}</span> platform revenue.
                            </p>
                        </div>
                         <div className="p-4 border rounded-lg bg-background">
                            <h4 className="font-semibold">Supplier & Buy/Sell Malls:</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                                On a <span className="font-mono">{formatCurrency(exampleSupplierSpend)}</span> parts purchase, a {supplierMallPlatformCommission*100}% commission yields <span className="font-mono text-primary">{formatCurrency(supplierPlatformEarnings)}</span> revenue. On a <span className="font-mono">{formatCurrency(exampleTruckSale)}</span> vehicle sale, a {buySellMallPlatformCommission*100}% success fee yields <span className="font-mono text-primary">{formatCurrency(buySellPlatformEarnings)}</span> revenue.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShoppingBasket className="h-5 w-5 text-primary" />
                        Stream 3: Value-Added Product Sales
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                       We partner with third-party providers to offer essential services like specialized insurance, driver wellness programs (Mahala Hub), and legal assistance (RAF Assist). The platform earns a margin on each subscription or service sold through the Marketplace.
                    </p>
                </CardContent>
                 <CardFooter>
                    <p className="text-sm text-muted-foreground">This multi-stream model ensures platform sustainability and creates diverse earning opportunities for our ISA and Network Partners.</p>
                </CardFooter>
            </Card>
        </div>
    );
}
