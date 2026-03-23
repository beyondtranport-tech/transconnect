
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Store, Handshake, Send, Wallet, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getClientSideAuthToken } from '@/firebase';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

async function fetchFromAdminAPI(token: string, action: string, payload?: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, payload }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error for action: ${action}`);
    }
    return result.data;
}

const StatCard = ({ title, value, icon, link, linkText }: { title: string, value: number, icon: React.ReactNode, link: string, linkText: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
        <CardFooter>
             <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={link}>{linkText} <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
        </CardFooter>
    </Card>
);


export default function DashboardContent() {
    const [queues, setQueues] = useState({ pendingShops: 0, pendingAgreements: 0, pendingPayouts: 0, pendingPayments: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const loadDashboardData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed: User token not found.");

            const [queuesRes, payoutsRes, paymentsRes] = await Promise.all([
                fetchFromAdminAPI(token, 'getDashboardQueues').catch(e => ({ pendingShops: [], proposedAgreements: [] })),
                fetchFromAdminAPI(token, 'getPendingPayouts').catch(e => ([])),
                fetchFromAdminAPI(token, 'getWalletPayments').catch(e => ([])),
            ]);
            
            setQueues({
                pendingShops: queuesRes.pendingShops.length,
                pendingAgreements: queuesRes.proposedAgreements.length,
                pendingPayouts: payoutsRes.length,
                pendingPayments: paymentsRes.filter((p:any) => p.status === 'pending').length
            });

        } catch (e: any) {
            setError(e.message);
            toast({
                variant: "destructive",
                title: "Failed to load dashboard data",
                description: e.message
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]); 

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    if (isLoading) {
        return <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    if (error) {
        return (
            <Card className="bg-destructive/10 border-destructive text-destructive-foreground">
                <CardHeader><CardTitle>Error Loading Dashboard</CardTitle></CardHeader>
                <CardContent>
                    <p>{error}</p>
                    <Button onClick={loadDashboardData} className="mt-4">Try Again</Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Operations Dashboard</h1>
                <p className="text-muted-foreground">A summary of pending tasks and queues that require your attention.</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
               <StatCard 
                    title="Pending Shop Approvals"
                    value={queues.pendingShops}
                    icon={<Store className="h-4 w-4 text-muted-foreground" />}
                    link="/backend?view=shops"
                    linkText="Review Shops"
               />
               <StatCard 
                    title="Pending Commercials"
                    value={queues.pendingAgreements}
                    icon={<Handshake className="h-4 w-4 text-muted-foreground" />}
                    link="/backend?view=commercial-negotiations"
                    linkText="Review Negotiations"
               />
                <StatCard 
                    title="Pending Payouts"
                    value={queues.pendingPayouts}
                    icon={<Send className="h-4 w-4 text-muted-foreground" />}
                    link="/backend?view=wallet-transactions"
                    linkText="Process Payouts"
               />
                <StatCard 
                    title="Pending Top-ups"
                    value={queues.pendingPayments}
                    icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
                    link="/backend?view=wallet-transactions"
                    linkText="Approve Top-ups"
               />
            </div>
        </div>
    );
}
