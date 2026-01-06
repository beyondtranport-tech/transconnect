
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Store, Banknote, Settings, BarChart, Combine, BookOpen, LineChart } from "lucide-react";
import Link from 'next/link';
import { useEffect, useState } from "react";
import { getClientSideAuthToken } from "@/firebase";
import { Loader2 } from "lucide-react";

async function fetchStats(action: string) {
    const token = await getClientSideAuthToken();
    if (!token) throw new Error("Authentication failed.");
    
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error for action: ${action}`);
    }
    return result.data;
}


export default function AccountDashboard() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    const operationalCards = [
        {
            title: "Bank & Reconciliation",
            description: "Reconcile bank statements for the main business operating account.",
            href: "/backend?view=wallet-reconciliation",
            icon: Combine,
            cta: "Reconcile Transactions"
        },
        {
            title: "Platform Ledger",
            description: "View and manage the general ledger for all platform revenue and expenses.",
            href: "/adminaccount?view=platform-transactions",
            icon: BookOpen,
            cta: "View Ledger"
        },
        {
            title: "Budgets",
            description: "Manage and review the operational budgets for the platform.",
            href: "/adminaccount?view=budgets",
            icon: BookOpen,
            cta: "Manage Budgets"
        },
         {
            title: "Analytics",
            description: "View detailed analytics on user behavior and platform performance via Google Analytics.",
            href: "https://analytics.google.com",
            icon: LineChart,
            cta: "View Analytics"
        }
    ];

    return (
        <div className="w-full space-y-8">
            <div className="flex items-center gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold font-headline">Business Account Dashboard</h1>
                    <p className="text-lg text-muted-foreground">High-level overview and quick access to platform operations.</p>
                </div>
            </div>

             {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
             ): (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {operationalCards.map(card => (
                        <Card key={card.title} className="flex flex-col">
                            <CardHeader className="flex-row items-start gap-4">
                                <div className="bg-primary/10 p-3 rounded-lg">
                                    <card.icon className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle>{card.title}</CardTitle>
                                    <CardDescription className="mt-1">{card.description}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow" />
                            <CardFooter>
                                 <Button asChild className="w-full">
                                    <Link href={card.href} target={card.href.startsWith('http') ? '_blank' : '_self'}>
                                        {card.cta} <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
             )}
        </div>
    );
}
