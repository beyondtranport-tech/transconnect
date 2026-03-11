
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, TrendingUp, Handshake, AppWindow, DatabaseZap } from 'lucide-react';
import React from 'react';

const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number' || isNaN(amount)) return 'R 0';
    const integerPart = amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `R ${integerPart}`;
};

export default function InvestorOffer() {
    const year1_total_revenue = 2880000, year3_total_revenue = 43200000, year1_net_profit = 1008000, year3_net_profit = 19440000;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">The Two-Part Investment Opportunity</h1>
                <p className="text-lg text-muted-foreground mt-2">Logistics Flow offers two distinct and independent opportunities for investors: a high-growth equity investment in our platform and a stable, debt-based investment in the debtors book we originate.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><AppWindow className="h-6 w-6 text-primary"/>Opportunity 1: Equity in the Platform</CardTitle>
                        <CardDescription>Invest in the technology and ecosystem of Logistics Flow itself.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-grow">
                        <p>This is a venture capital-style investment in a high-growth SaaS platform with multiple, diversified revenue streams.</p>
                        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                            <li><strong className="text-foreground">SaaS Revenue:</strong> Recurring income from tiered membership plans and add-on services like our AI toolkit.</li>
                            <li><strong className="text-foreground">Commission Revenue:</strong> A percentage fee on all transactions across our Finance, Supplier, and Buy & Sell Malls.</li>
                            <li><strong className="text-foreground">Marketplace Sales:</strong> Revenue from the sale of value-added third-party products.</li>
                        </ul>
                        <p className="pt-2">Your investment fuels platform development, user acquisition, and market expansion, with returns driven by the platform's overall growth and profitability.</p>
                    </CardContent>
                </Card>
                 <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><DatabaseZap className="h-6 w-6 text-primary"/>Opportunity 2: Funding the Debtors Book</CardTitle>
                        <CardDescription>Provide the capital for the finance deals originated through our platform.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-grow">
                        <p>This is a debt investment opportunity where you act as a lender, earning returns from the interest and fees on the finance provided to our members.</p>
                         <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                            <li><strong className="text-foreground">Deal Origination Engine:</strong> The platform generates a consistent flow of pre-vetted, data-enriched applications for asset finance and working capital.</li>
                            <li><strong className="text-foreground">De-Risked Lending:</strong> Our ecosystem provides unique, first-party data on a business's real-time performance, allowing for more accurate risk assessment than traditional models.</li>
                            <li><strong className="text-foreground">Structured Returns:</strong> The complete Lending Model will provide detailed projections on the debtors book's performance, returns, and cash flow recycling.</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary"/>Platform Financial Projections (Illustrative)</CardTitle>
                     <CardDescription>The following projections relate to the <strong className="text-foreground">Equity Opportunity (Opportunity 1)</strong> and demonstrate the platform's revenue-generating potential.</CardDescription>
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

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary"/>Debtors Book Financial Projections (Placeholder)</CardTitle>
                     <CardDescription>The following projections relate to the <strong className="text-foreground">Debt Opportunity (Opportunity 2)</strong>. These are high-level estimates based on the full lending model.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Metric</TableHead><TableHead className="text-right">Year 1 Projection</TableHead><TableHead className="text-right">Year 3 Projection</TableHead></TableRow></TableHeader>
                        <TableBody>
                            <TableRow><TableCell>Projected Book Value</TableCell><TableCell className="text-right font-semibold">R 50M</TableCell><TableCell className="text-right font-semibold">R 250M</TableCell></TableRow>
                            <TableRow><TableCell>Average Yield</TableCell><TableCell className="text-right font-semibold">18.5%</TableCell><TableCell className="text-right font-semibold">17.0%</TableCell></TableRow>
                            <TableRow className="bg-primary/5"><TableCell className="font-bold">Projected Net Interest Margin</TableCell><TableCell className="text-right font-bold text-primary text-lg">R 7.5M</TableCell><TableCell className="text-right font-bold text-primary text-lg">R 37.5M</TableCell></TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
                 <CardFooter><p className="text-xs text-muted-foreground">Disclaimer: These are high-level projections. A detailed breakdown is available in the full Lending Model.</p></CardFooter>
            </Card>
        </div>
    );
}
