
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Clock, TrendingUp, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { useState, useEffect, useCallback, useMemo } from 'react';
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

export default function DashboardContent() {
    const { user, isUserLoading } = useUser();
    const [leads, setLeads] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed");
            
            // Unified view: Fetch ALL partner types to populate the master funnel
            const [leadsRes, membersRes] = await Promise.all([
                fetchFromAdminAPI(token, 'getPartnersByType', { type: 'all' }),
                fetchFromAdminAPI(token, 'getMembers')
            ]);
            
            setLeads(leadsRes.data || []);
            setCompanies(membersRes.data || []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isUserLoading && user) loadData();
    }, [isUserLoading, user, loadData]);

    const funnelData = useMemo(() => {
        const total = leads.length;
        const reached = leads.filter(l => ['contacted', 'invited', 'active', 'qualified'].includes(l.status)).length;
        const converted = companies.filter(c => c.leadId).length;
        const paying = companies.filter(c => c.leadId && c.membershipId && c.membershipId !== 'free').length;

        return [
            { stage: 'AI Leads Discovered', count: total, color: 'hsl(var(--muted))' },
            { stage: 'Outreached/Qualified', count: reached, color: 'hsl(var(--primary))', opacity: 0.6 },
            { stage: 'Active Members', count: converted, color: 'hsl(var(--primary))', opacity: 0.8 },
            { stage: 'Paying Members', count: paying, color: 'hsl(var(--primary))', opacity: 1 },
        ];
    }, [leads, companies]);

    if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold font-headline">Platform Intelligence</h1>
                    <p className="text-muted-foreground">Aggregated flow from AI Discovery to Active Membership ({leads.length} entities tracked).</p>
                </div>
                <Button variant="outline" onClick={loadData} size="sm"><Clock className="mr-2 h-4 w-4"/> Refresh Analytics</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {funnelData.map((stage, idx) => (
                    <Card key={stage.stage} className="relative overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stage.stage}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold">{stage.count}</div>
                            {idx > 0 && funnelData[idx-1].count > 0 && (
                                <p className="text-[10px] font-bold text-green-600 mt-1 uppercase">
                                    {((stage.count / funnelData[idx-1].count) * 100).toFixed(1)}% step conversion
                                </p>
                            )}
                        </CardContent>
                        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: stage.color, opacity: stage.opacity }} />
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 shadow-xl border-primary/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl"><TrendingUp className="h-5 w-5 text-primary"/> Unified Conversion Funnel</CardTitle>
                        <CardDescription>Real-time tracking of discovery success across all industrial categories.</CardDescription>
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

                <Card className="shadow-xl border-primary/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-amber-500"/> Pipeline Velocity</CardTitle>
                        <CardDescription>Recent conversions from AI Discovery leads.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold">Yield Efficiency</p>
                                    <p className="text-[10px] uppercase text-muted-foreground tracking-widest">Discovery to Registration</p>
                                </div>
                                <div className="text-2xl font-black text-primary">
                                    {leads.length > 0 ? ((companies.filter(c => c.leadId).length / leads.length) * 100).toFixed(1) : 0}%
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Latest Successes</h4>
                                {companies.filter(c => c.leadId).slice(0, 3).map(c => (
                                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                                        <div className="bg-green-100 p-1.5 rounded-full"><CheckCircle2 className="h-4 w-4 text-green-600" /></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate">{c.companyName}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase">{c.membershipId || 'Free'} Plan</p>
                                        </div>
                                    </div>
                                ))}
                                {companies.filter(c => c.leadId).length === 0 && (
                                    <p className="text-xs text-center text-muted-foreground py-4 italic">Awaiting first lead conversion...</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="ghost" className="w-full text-[10px] uppercase font-bold tracking-widest" asChild>
                            <Link href="/adminaccount?view=unified-directory">Unified Registry <ArrowRight className="ml-2 h-3 w-3"/></Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
