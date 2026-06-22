'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Store, Banknote, Handshake, CheckCircle, TrendingUp, DollarSign, ShieldCheck, Loader2, Zap, Search } from "lucide-react";
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

    const membershipCommissionShare = 30;
    const transactionalCommissionShare = salesIncentives?.networkBaseCommission || 10;
    const supplierMallCommission = mallCommissions?.supplierMall || 2.5;

    return (
        <div className="space-y-8 text-left">
            <div className="text-left">
                <h1 className="text-3xl font-bold font-headline text-left">The Intelligence-Driven Supplier Offer</h1>
                <p className="text-lg text-muted-foreground mt-2 text-left">
                    Move beyond being just a vendor. Become a data-powered partner with direct access to your most profitable customers.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 text-left">
                <Card className="flex flex-col border-primary/20 bg-primary/5 text-left">
                    <CardHeader className="text-left">
                        <CardTitle className="flex items-center gap-3 text-left">
                            <Search className="h-6 w-6 text-primary" />
                            Forensic Lead Generation
                        </CardTitle>
                        <CardDescription className="text-left">Identify and contact decision-makers instantly.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-3 text-left">
                         <div className="flex items-start gap-3 text-left">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-1 shrink-0" />
                            <span className="text-sm">Search the national transporter registry by vehicle type, region, and fleet size.</span>
                        </div>
                        <div className="flex items-start gap-3 text-left">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-1 shrink-0" />
                            <span className="text-sm font-bold">Access direct MD/Owner mobile numbers and emails—bypass generic switchboards.</span>
                        </div>
                    </CardContent>
                </Card>

                 <Card className="flex flex-col text-left">
                    <CardHeader className="text-left">
                        <CardTitle className="flex items-center gap-3 text-left">
                            <Store className="h-6 w-6 text-primary" />
                            Your Digital Branch
                        </CardTitle>
                         <CardDescription className="text-left">A high-fidelity storefront in our Supplier Mall.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-3 text-left">
                         <div className="flex items-start gap-3 text-left">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-1 shrink-0" />
                            <span className="text-sm">Showcase your specialized inventory to a community of fleet owners actively searching for your parts.</span>
                        </div>
                         <div className="flex items-start gap-3 text-left">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-1 shrink-0" />
                            <span className="text-sm">Receive direct RFQs and secure payments through our integrated wallet system.</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-2 border-primary text-left">
                <CardHeader className="text-left">
                    <CardTitle className="flex items-center gap-3 text-left">
                        <TrendingUp className="h-6 w-6 text-primary"/>
                        Revenue Amplification
                    </CardTitle>
                    <CardDescription className="text-left">
                        Earn recurring commissions while you sell parts.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-left">
                    <div className="text-left">
                        <h4 className="font-semibold text-lg text-left">1. Network Monetization</h4>
                        <p className="text-muted-foreground mt-2 text-left leading-relaxed">
                            Refer your existing clients to Logistics Flow. You earn a <strong>{membershipCommissionShare}% recurring share</strong> of their membership fees and a share of any finance or part transactions they conduct in our Malls.
                        </p>
                    </div>
                     <div className="text-left">
                        <h4 className="font-semibold text-lg text-left">2. Embedded Finance</h4>
                        <p className="text-muted-foreground mt-2 text-left leading-relaxed">
                            Never lose a sale to a customer's cash flow constraint. Members can get instant credit at checkout to purchase from you. You get paid in full, upfront.
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="bg-slate-50 border-t p-6 text-left">
                    <div className="flex items-center gap-3 text-left">
                        <Zap className="h-5 w-5 text-primary fill-primary" />
                        <p className="text-sm font-bold text-left">Activate "Intelligence Access" for R100/mo to unlock full forensic data.</p>
                    </div>
                </CardFooter>
            </Card>
            
            <div className="text-center pt-8">
                 <Button asChild size="lg" className="h-14 px-12 text-lg font-bold">
                    <Link href="/account?view=shop">
                        Join & Unlock Intelligence <ArrowRight className="ml-2 h-5 w-5"/>
                    </Link>
                </Button>
            </div>
        </div>
    );
}
