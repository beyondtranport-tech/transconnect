'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Truck, CheckCircle, ShieldCheck, Zap, Users, BarChart3, Search, Landmark, DollarSign, TrendingUp, ShoppingBasket } from "lucide-react";
import React from "react";
import { useConfig } from '@/hooks/use-config';
import { Loader2 } from 'lucide-react';

export default function TransporterOffer({ partner }: { partner?: any }) {
    const { data: isaConfig, isLoading: isIsaLoading } = useConfig<any>('isaPitch');

    if (isIsaLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    const isaMembershipShare = isaConfig?.membershipCommission || 30;
    const isaFinanceShare = isaConfig?.financeMallCommission || 20;
    const isaMarketplaceShare = isaConfig?.marketplaceCommission || 50;

    return (
        <div className="space-y-8 text-left text-foreground">
            <div className="text-left">
                <h1 className="text-3xl font-bold font-headline text-left">The Intelligence-Driven Haulier Offer</h1>
                <p className="text-lg text-muted-foreground mt-2 text-left">Break the constraints of empty miles and high operating costs with shared intelligence.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 text-left">
                <Card className="flex flex-col text-left">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-left"><DollarSign className="h-6 w-6 text-primary"/>Benefit #1: Recurring Revenue Stream</CardTitle>
                        <CardDescription className="text-left">Earn from your industry connections.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-grow text-left">
                        <p className="text-sm text-muted-foreground">Turn your empty miles into an income engine. Refer other hauliers and earn a <strong className="text-primary">{isaMembershipShare}% recurring share</strong> of their membership fees.</p>
                    </CardContent>
                </Card>
                 <Card className="flex flex-col text-left">
                    <CardHeader className="text-left">
                        <CardTitle className="flex items-center gap-2 text-left"><TrendingUp className="h-6 w-6 text-primary"/>Benefit #2: Transactional Revenue Share</CardTitle>
                         <CardDescription className="text-left">Participate in ecosystem deal flow.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-grow text-left">
                        <p className="text-sm text-muted-foreground">Receive a <strong className="text-primary">{isaFinanceShare}% share</strong> of platform origination fees when your network members finance assets through our 85+ lenders.</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="text-left">
                <CardHeader className="text-left">
                    <CardTitle className="flex items-center gap-2 text-left"><ShoppingBasket className="h-6 w-6 text-primary" />Benefit #3: Earn from Value-Added Products</CardTitle>
                    <CardDescription className="text-left">Protect your peers and earn splits.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-left">
                    <p className="text-sm text-muted-foreground">Offer essential driver benefits and liability cover to your contractors with an immediate <strong className="text-primary">{isaMarketplaceShare}% commission split</strong>.</p>
                </CardContent>
                <CardFooter className="bg-slate-50 border-t p-6 text-left">
                    <div className="flex items-center gap-3 text-left text-foreground">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        <p className="text-sm font-bold text-left">Activate "Intelligence Access" for R100/mo to view the full haulier registry.</p>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
