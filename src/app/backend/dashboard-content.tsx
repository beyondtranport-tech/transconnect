'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Store, Handshake, Send, Wallet, ArrowRight, TrendingUp, Zap, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, Cell, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Separator } from '@/components/ui/separator';

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
    return result;
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
    const [leads, setLeads] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const loadDashboardData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed: User token not found.");

            const [queuesRes, payoutsRes, paymentsRes, leadsRes, membersRes] = await Promise.all([
                fetchFromAdminAPI(token, 'getDashboardQueues').catch(e => ({ pendingShops: [], proposedAgreements: [] })),
                fetchFromAdminAPI(token, 'getPendingPayouts').catch(e => ([])),
                fetchFromAdminAPI(token, 'getWalletPayments').catch(e => ([])),
                fetchFromAdminAPI(token, 'getPartnersByType', { type: 'transporter' }),
                fetchFromAdminAPI(token, 'getMembers')
            ]);
            
            setQueues({
                pendingShops: queuesRes.pendingShops.length,
                pendingAgreements: queuesRes.proposedAgreements.length,
                pendingPayouts: payoutsRes.length,
                pendingPayments: paymentsRes.filter((p:any) => p.status === 'pending').length
            });
            setLeads(leadsRes.data || []);
            setCompanies(membersRes.data || []);

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

    const funnelData = useMemo(() => {
        const total = leads.length;
        const reached = leads.filter(l => ['contacted', 'invited', 'active'].includes(l.status)).length;
        const converted = companies.filter(c => !!c.leadId).length;
        const paying = companies.filter(c => !!c.leadId && c.membershipId !== 'free').length;

        return [
            { stage: 'AI Leads Found', count: total, color: 'hsl(var(--muted))' },
            { stage: 'Outreached', count: reached, color: 'hsl(var(--primary))', opacity: 0.6 },
            { stage: 'Active Members', count: converted, color: 'hsl(var(--primary))', opacity: 0.8 },
            { stage: 'Paying Members', count: paying, color: 'hsl(var(--primary))', opacity: 1 },
        ];
    }, [leads, companies]);

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
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold font-headline">Operations Dashboard</h1>
                    <p className="text-muted-foreground">Monitoring your active queues and conversion funnel.</p>
                </div>
                <Button variant="outline" onClick={loadDashboardData} size="sm"><Clock className="mr-2 h-4 w-4"/> Refresh Metrics</Button>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl"><TrendingUp className="h-5 w-5 text-primary"/> Acquisition Funnel Intelligence</CardTitle>
                        <CardDescription>Visualizing the conversion path from AI leads to live platform members.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={funnelData} layout="vertical" margin={{ left: 40, right: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="stage" type="category" width={150} tick={{ fontSize: 12, fontWeight: 'bold' }} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                    {funnelData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={entry.opacity} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-amber-500"/> Conversion Insights</CardTitle>
                        <CardDescription>Summary of your outreach efficiency.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold">Total Conversions</p>
                                    <p className="text-[10px] uppercase text-muted-foreground tracking-widest">Leads to Live Account</p>
                                </div>
                                <div className="text-2xl font-black text-primary">
                                    {companies.filter(c => !!c.leadId).length}
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Recent Conversions</h4>
                                {companies.filter(c => !!c.leadId).slice(0, 3).map(c => (
                                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                                        <div className="bg-green-100 p-1.5 rounded-full"><CheckCircle2 className="h-4 w-4 text-green-600" /></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate">{c.companyName}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase">{c.source || 'AI Converted'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="ghost" className="w-full text-[10px] uppercase font-bold tracking-widest" asChild>
                            <Link href="/backend?view=members">View Full Registry <ArrowRight className="ml-2 h-3 w-3"/></Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
