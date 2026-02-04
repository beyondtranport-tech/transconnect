
'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, Briefcase } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from 'react';
import FinancialForecast from './financial-forecast';

// --- Copied components from investor-dashboard to make this self-contained ---

// --- Overview Content ---
const overviewSections = [
    {
        title: "The Problem We Solve for Transporters",
        points: [
            "Access to capital is a primary roadblock, as traditional banks often reject viable businesses.",
            "Individual operators lack the collective buying power to secure meaningful discounts on parts, tires, and services.",
            "Profitability is severely impacted by 'deadhead miles'—empty return journeys that represent wasted capacity and revenue.",
            "The industry is highly fragmented, leading to major inefficiencies for small and medium operators."
        ]
    },
    {
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
            {overviewSections.map(section => (
                <Card key={section.title}>
                    <CardHeader><CardTitle>{section.title}</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                            {section.points.map((point, index) => (
                                <li key={index}>{point}</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

// --- InvestorOffer Content ---
function InvestorOffer() {
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Multi-Stream Revenue Model</CardTitle>
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
        </div>
    );
}

// --- Main Investor Pitch Page ---

function InvestorPitchPage() {
    const params = useParams();
    const investorId = params.investorId as string;
    const firestore = useFirestore();

    const investorRef = useMemoFirebase(() => {
        if (!firestore || !investorId) return null;
        return doc(firestore, 'partners', investorId);
    }, [firestore, investorId]);
    
    const { data: investor, isLoading } = useDoc(investorRef);

    if (isLoading) {
        return <div className="flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin" /></div>;
    }

    if (!investor) {
        return <div className="text-center py-20">Investor not found.</div>;
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
