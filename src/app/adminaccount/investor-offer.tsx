'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, TrendingUp } from 'lucide-react';
import React from 'react';

const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(amount);
};

export default function InvestorOffer() {
    const year1_total_revenue = 2880000, year3_total_revenue = 43200000, year1_net_profit = 1008000, year3_net_profit = 19440000;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">The Investment Offer</h1>
                <p className="text-lg text-muted-foreground mt-2">A high-level overview of our financial model and revenue projections.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><DollarSign className="h-6 w-6 text-primary"/>Multi-Stream Revenue Model</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <p className="text-muted-foreground">Our platform generates revenue through three primary, diversified streams:</p>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="p-4 border rounded-lg"><h4 className="font-semibold">1. Membership Subscriptions</h4><p className="text-sm text-muted-foreground mt-1">Recurring revenue from members on paid plans.</p></div>
                        <div className="p-4 border rounded-lg"><h4 className="font-semibold">2. Transaction Commissions</h4><p className="text-sm text-muted-foreground mt-1">A percentage fee on all mall transactions.</p></div>
                        <div className="p-4 border rounded-lg"><h4 className="font-semibold">3. SaaS & Value-Added Services</h4><p className="text-sm text-muted-foreground mt-1">Fees for tech tools and Marketplace products.</p></div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary"/>Financial Projections (Illustrative)</CardTitle>
                     <CardDescription>Based on our sales roadmap and market assumptions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Metric</TableHead><TableHead className="text-right">Year 1 Projection</TableHead><TableHead className="text-right">Year 3 Projection</TableHead></TableRow></TableHeader>
                        <TableBody>
                            <TableRow><TableCell>Total Members</TableCell><TableCell className="text-right font-semibold">1,200</TableCell><TableCell className="text-right font-semibold">15,000</TableCell></TableRow>
                            <TableRow><TableCell>Total Annual Revenue</TableCell><TableCell className="text-right font-semibold">{formatCurrency(year1_total_revenue)}</TableCell><TableCell className="text-right font-semibold">{formatCurrency(year3_total_revenue)}</TableCell></TableRow>
                            <TableRow className="bg-primary/5"><TableCell className="font-bold">Projected Net Profit</TableCell><TableCell className="text-right font-bold text-primary text-lg">{formatCurrency(year1_net_profit)}</TableCell><TableCell className="text-right font-bold text-primary text-lg">{formatCurrency(year3_net_profit)}</TableCell></TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
                 <CardFooter><p className="text-xs text-muted-foreground">Disclaimer: These projections are illustrative and not a guarantee of future performance.</p></CardFooter>
            </Card>
        </div>
    );
}
