
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Clock, TrendingUp, Zap, ArrowRight, CheckCircle2, Building, Star } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { BarChart, Bar, Cell, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Separator } from '@/components/ui/separator';

async function fetchFromAdminAPI(token: string, action: string, payload?: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
        cache: 'no-store'
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
    
    // Stabilize UID for dependency array to prevent loop
    const uid = user?.uid;

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            
            // Capped read for dashboard stats
            const [leadsRes, membersRes] = await Promise.all([
                fetchFromAdminAPI(token, 'searchRegistry', { type: 'all' }),
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
        if (!isUserLoading && uid) {
            loadData();
        }
    }, [isUserLoading, uid, loadData]);

    const funnelData = useMemo(() => {
        const total = leads.length;
        const reached = leads.filter(l => ['contacted', 'invited', 'active', 'qualified'].includes(l.status)).length;
        const converted = companies.filter(c => c.leadId).length;
        const paying = companies.filter(c => c.leadId && c.membershipId && c.membershipId !== 'free').length;

        return [
            { stage: 'Leads Discovered', count: total, color: 'hsl(var(--muted))' },
            { stage: 'Qualified/Outreached', count: reached, color: 'hsl(var(--primary))', opacity: 0.6 },
            { stage: 'Registered Members', count: converted, color: 'hsl(var(--primary))', opacity: 0.8 },
            { stage: 'Paying Intelligence', count: paying, color: 'hsl(var(--primary))', opacity: 1 },
        ];
    }, [leads, companies]);

    if (isLoading) return <div className="flex justify-center p-20 text-center"><Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" /><p className="mt-4 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Mapping Stats...</p></div>;

    return (
        <div className="space-y-8 text-left">
            <div className="flex justify-between items-end">
                <div className="text-left">
                    <h1 className="text-2xl font-bold font-headline">Platform Intelligence</h1>
                    <p className="text-muted-foreground">Flow analysis from Discovery to Paying Membership.</p>
                </div>
                <Button variant="outline" onClick={loadData} size="sm"><Clock className="mr-2 h-4 w-4"/> Refresh</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {funnelData.map((stage, idx) => (
                    <Card key={stage.stage} className="relative overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stage.stage}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black">{stage.count}</div>
                            {idx > 0 && funnelData[idx-1].count > 0 && (
                                <p className="text-[10px] font-bold text-green-600 mt-1 uppercase">
                                    {((stage.count / funnelData[idx-1].count) * 100).toFixed(1)}% Yield
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
                        <CardTitle className="flex items-center gap-2 text-xl"><TrendingUp className="h-5 w-5 text-primary"/> Success Funnel</CardTitle>
                        <CardDescription>Capped view of the most recent 1,000 industrial records.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={funnelData} layout="vertical" margin={{ left: 40, right: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="stage" type="category" width={150} tick={{ fontSize: 10, fontWeight: 'bold' }} />
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
                        <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-amber-500"/> Pipeline Growth</CardTitle>
                        <CardDescription>Recent conversions from AI Discovery.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {companies.filter(c => c.leadId).slice(0, 4).map(c => (
                                <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                                    <div className="bg-green-100 p-1.5 rounded-full"><CheckCircle2 className="h-4 w-4 text-green-600" /></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold truncate">{c.companyName}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase">{c.membershipId || 'Free'} Plan</p>
                                    </div>
                                </div>
                            ))}
                            {companies.filter(c => c.leadId).length === 0 && (
                                <p className="text-xs text-center text-muted-foreground py-8 italic">No recent conversions detected.</p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="ghost" className="w-full text-[10px] uppercase font-bold tracking-widest" asChild>
                            <Link href="/adminaccount?view=unified-directory">Unified Directory <ArrowRight className="ml-2 h-3 w-3"/></Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
