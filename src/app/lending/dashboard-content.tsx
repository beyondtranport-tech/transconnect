
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Users, FileText, Briefcase, Landmark, Handshake, Database, ShieldCheck, FileCheck, FileSignature, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { getClientSideAuthToken } from '@/firebase';

async function performAdminAction(token: string, action: string, payload?: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error for action: ${action}`);
    }
    return result.data;
}


const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'R 0.00M';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', notation: 'compact' }).format(value);
};

const queues = [
  { title: "New Applications", value: "8", icon: FileSignature, description: "Applications in discovery/scoring.", view: "discovery" },
  { title: "Agreements to Finalize", value: "4", icon: FileCheck, description: "Awaiting final checks and payout.", view: "agreements" },
  { title: "Asset Verifications", value: "12", icon: Wrench, description: "Assets pending physical verification.", view: "assets" },
  { title: "Security Registrations", value: "6", icon: ShieldCheck, description: "Collateral awaiting legal registration.", view: "security" },
];

export default function LendingDashboardContent() {
    const [stats, setStats] = useState({
        clients: 0,
        agreements: 0,
        assets: 0,
        totalLoanBook: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string|null>(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            const [clientsData, agreementsData, assetsData] = await Promise.all([
                performAdminAction(token, 'getLendingData', { collectionName: 'lendingClients' }),
                performAdminAction(token, 'getLendingData', { collectionName: 'agreements' }),
                performAdminAction(token, 'getLendingData', { collectionName: 'lendingAssets' })
            ]);
            
            const totalLoanBook = (agreementsData || []).reduce((sum: number, agreement: any) => sum + (agreement.amount || 0), 0);

            setStats({
                clients: (clientsData || []).length,
                agreements: (agreementsData || []).length,
                assets: (assetsData || []).length,
                totalLoanBook: totalLoanBook,
            });

        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);


    const kpis = [
      { title: "Clients", value: stats.clients, icon: Users, view: "clients" },
      { title: "Active Agreements", value: stats.agreements, icon: FileText, view: "agreements" },
      { title: "Total Assets Financed", value: stats.assets, icon: Briefcase, view: "assets" },
      { title: "Total Loan Book", value: formatCurrency(stats.totalLoanBook), icon: Landmark, view: "loan-book" },
    ];


    if (isLoading) {
        return (
             <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

     if (error) {
        return (
            <Card className="bg-destructive/10 border-destructive">
                <CardHeader><CardTitle className="text-destructive">Error Loading Dashboard</CardTitle></CardHeader>
                <CardContent>
                    <p>{error}</p>
                    <Button onClick={loadData} className="mt-4">Try Again</Button>
                </CardContent>
            </Card>
        )
    }


    return (
         <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">DMS Dashboard</h1>
                <p className="text-muted-foreground">High-level overview of the Debtor Management System.</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {kpis.map(kpi => (
                     <Link href={`/lending?view=${kpi.view}`} key={kpi.title}>
                        <Card className="hover:bg-accent transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                                <kpi.icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{kpi.value}</div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Action Queues</CardTitle>
                        <CardDescription>Items requiring immediate attention from the credit committee.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {queues.map(queue => (
                             <Card key={queue.title} className="p-4 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                     <queue.icon className="h-6 w-6 text-primary" />
                                    <div>
                                        <p className="font-semibold">{queue.title}</p>
                                        <p className="text-xs text-muted-foreground">{queue.description}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold">{queue.value}</p>
                                     <Button asChild variant="link" size="sm" className="p-0 h-auto">
                                        <Link href={`/lending?view=${queue.view}`}>View</Link>
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest system and user actions.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center py-20 text-muted-foreground">
                        <p>Activity feed will be displayed here.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
