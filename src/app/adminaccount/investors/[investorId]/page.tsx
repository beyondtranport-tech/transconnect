
'use client';

import { Suspense, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, Briefcase, Info, Presentation, Mail, Handshake, DollarSign, TrendingUp, CheckCircle, Cpu, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import React from 'react';
import FinancialForecast from './financial-forecast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// --- Re-inlined the components ---

const overviewSections = [
    {
        icon: <AlertCircle className="h-8 w-8 text-destructive" />,
        title: "The Problem We Solve for Transporters",
        points: [
            "Access to capital is a primary roadblock, as traditional banks often reject viable businesses.",
            "Individual operators lack the collective buying power to secure meaningful discounts on parts, tires, and services.",
            "Profitability is severely impacted by 'deadhead miles'—empty return journeys that represent wasted capacity and revenue.",
            "The industry is highly fragmented, leading to major inefficiencies for small and medium operators."
        ]
    },
    {
        icon: <Handshake className="h-8 w-8 text-primary" />,
        title: "The Investment Opportunity",
        points: [
            "Capitalize on a first-mover advantage in a massive, underserved market with a proven business model.",
            "Invest in a platform with multiple, diversified revenue streams: subscription fees, transaction commissions, and SaaS product sales.",
            "The platform is designed for exponential growth through powerful network effects; as the community grows, its value and revenue potential increase.",
            "Our technology is built to scale, ensuring low marginal costs for each new member added to the ecosystem."
        ]
    }
];

function Overview() {
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-3"><Cpu className="h-8 w-8 text-primary" />What is TransConnect?</CardTitle></CardHeader>
                <CardContent>
                    <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                        <li>An integrated digital ecosystem designed specifically for the South African transport industry.</li>
                        <li>A platform that unifies four core business pillars: Funding, a multi-faceted Mall, a value-added Marketplace, and a powerful Tech division.</li>
                        <li>A reward-first, loyalty-driven community where member participation and collaboration create a high-value network.</li>
                    </ul>
                </CardContent>
            </Card>
            {overviewSections.map(section => (
                <Card key={section.title}>
                    <CardHeader><CardTitle className="flex items-center gap-3">{section.icon}{section.title}</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                            {section.points.map((point, index) => ( <li key={index}>{point}</li> ))}
                        </ul>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function InvestorOffer() {
     const year1_total_revenue = 2880000, year3_total_revenue = 43200000, year1_net_profit = 1008000, year3_net_profit = 19440000;
     const formatCurrency = (amount: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(amount);
    return (
        <div className="space-y-8">
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-6 w-6 text-primary"/>Multi-Stream Revenue Model</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     <p className="text-muted-foreground">Our platform generates revenue through three primary, diversified streams:</p>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="p-4 border rounded-lg"><h4 className="font-semibold">1. Membership Subscriptions</h4><p className="text-sm text-muted-foreground mt-1">Recurring revenue from members on paid plans.</p></div>
                        <div className="p-4 border rounded-lg"><h4 className="font-semibold">2. Transaction Commissions</h4><p className="text-sm text-muted-foreground mt-1">A percentage fee on all mall transactions.</p></div>
                        <div className="p-4 border rounded-lg"><h4 className="font-semibold">3. SaaS & Value-Added Services</h4><p className="text-sm text-muted-foreground mt-1">Fees for tech tools and Marketplace products.</p></div>
                    </div>
                </CardContent>
            </Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary"/>Financial Projections (Illustrative)</CardTitle><CardDescription>Based on our sales roadmap and market assumptions.</CardDescription></CardHeader>
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
// --- END Re-inlining ---


function InvestorPitchPage() {
    const params = useParams();
    const investorId = params.investorId as string;
    const firestore = useFirestore();

    const investorRef = useMemoFirebase(() => {
        if (!firestore || !investorId) return null;
        return doc(firestore, 'partners', investorId);
    }, [firestore, investorId]);
    
    const { data: investor, isLoading, error } = useDoc(investorRef);

    if (isLoading) {
        return <div className="flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin" /></div>;
    }
    
    if (error) {
        return <div className="text-center py-20 text-destructive">Error loading investor: {error.message}</div>;
    }

    if (!investor) {
        return <div className="text-center py-20 text-muted-foreground">Investor with ID "{investorId}" not found.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Briefcase className="h-8 w-8 text-primary"/>
                <div>
                    <h1 className="text-3xl font-bold">Investor Pitch: {investor.firstName} {investor.lastName}</h1>
                    <p className="text-muted-foreground">{investor.companyName || 'Individual Investor'}</p>
                </div>
            </div>

            <Tabs defaultValue="forecast" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="offer">The Offer</TabsTrigger>
                    <TabsTrigger value="forecast">Financial Forecast</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-6"><Overview /></TabsContent>
                <TabsContent value="offer" className="mt-6"><InvestorOffer /></TabsContent>
                <TabsContent value="forecast" className="mt-6">
                    <FinancialForecast investorId={investorId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-16 w-16 animate-spin" /></div>}>
            <InvestorPitchPage />
        </Suspense>
    )
}
