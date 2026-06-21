'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Clock, TrendingUp, Zap, ArrowRight, CheckCircle2, Building, Users, Star } from 'lucide-react';
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

    const supplierMetrics = useMemo(() => {
        const suppliers = companies.filter(c => c.shopType === 'vendor' || c.declaredRole === 'vendor');
        return {
            total: suppliers.length,
            paid: suppliers.filter(s => s.membershipId !== 'free').length,
            hasShop: suppliers.filter(s => !!s.shopId).length
        };
    }, [companies]);

    if (isLoading) return <div className="flex justify-center p-20 text-center"><Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" /><p className="mt-4 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Mapping Success Architecture...</p></div>;

    return (
        <div className="space-y-8 text-left">
            <div className="flex justify-between items-end text-left">
                <div className="text-left">
                    <h1 className="text-2xl font-bold font-headline text-left">Platform Intelligence</h1>
                    <p className="text-muted-foreground text-left">Aggregated flow from AI Discovery to Active Membership ({leads.length} entities tracked).</p>
                </div>
                <Button variant="outline" onClick={loadData} size="sm"><Clock className="mr-2 h-4 w-4"/> Refresh Analytics</Button>
            </div>

            {/* Focus: Supplier Onboarding & Monetization */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-primary/20 bg-primary/5 text-left">
                    <CardHeader className="pb-2 text-left">
                        <CardTitle className="text-xs font-black uppercase text-primary tracking-widest flex items-center gap-2 text-left">
                            <Building className="h-3 w-3"/> Supplier Onboarding
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-left">
                        <div className="text-3xl font-black">{supplierMetrics.total}</div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Vendors Registered</p>
                    </CardContent>
                </Card>
                <Card className="border-primary/20 bg-primary/5 text-left">
                    <CardHeader className="pb-2 text-left">
                        <CardTitle className="text-xs font-black uppercase text-primary tracking-widest flex items-center gap-2 text-left">
                            <Star className="h-3 w-3"/> Paid Conversions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-left">
                        <div className="text-3xl font-black">{supplierMetrics.paid}</div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Active Intelligence Subs</p>
                    </CardContent>
                </Card>
                <Card className="border-primary/20 bg-primary/5 text-left">
                    <CardHeader className="pb-2 text-left">
                        <CardTitle className="text-xs font-black uppercase text-primary tracking-widest flex items-center gap-2 text-left">
                            <Zap className="h-3 w-3"/> Shop Readiness
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-left">
                        <div className="text-3xl font-black">{supplierMetrics.hasShop}</div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Profiles Provisioned</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 text-left">
                {funnelData.map((stage, idx) => (
                    <Card key={stage.stage} className="relative overflow-hidden text-left">
                        <CardHeader className="pb-2 text-left">
                            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-left">{stage.stage}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-left">
                            <div className="text-3xl font-extrabold text-left">{stage.count}</div>
                            {idx > 0 && funnelData[idx-1].count > 0 && (
                                <p className="text-[10px] font-bold text-green-600 mt-1 uppercase text-left">
                                    {((stage.count / funnelData[idx-1].count) * 100).toFixed(1)}% step conversion
                                </p>
                            )}
                        </CardContent>
                        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: stage.color, opacity: stage.opacity }} />
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
                <Card className="lg:col-span-2 shadow-xl border-primary/10 text-left">
                    <CardHeader className="text-left">
                        <CardTitle className="flex items-center gap-2 text-xl text-left"><TrendingUp className="h-5 w-5 text-primary"/> Unified Conversion Funnel</CardTitle>
                        <CardDescription className="text-left">Real-time tracking of discovery success across all industrial categories.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80 text-left">
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

                <Card className="shadow-xl border-primary/10 text-left">
                    <CardHeader className="text-left">
                        <CardTitle className="flex items-center gap-2 text-left"><Zap className="h-5 w-5 text-amber-500"/> Pipeline Velocity</CardTitle>
                        <CardDescription className="text-left">Recent conversions from AI Discovery leads.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-left">
                        <div className="space-y-6 text-left">
                            <div className="flex items-center justify-between text-left">
                                <div className="space-y-1 text-left">
                                    <p className="text-sm font-bold text-left">Yield Efficiency</p>
                                    <p className="text-[10px] uppercase text-muted-foreground tracking-widest text-left">Discovery to Registration</p>
                                </div>
                                <div className="text-2xl font-black text-primary text-left">
                                    {leads.length > 0 ? ((companies.filter(c => c.leadId).length / leads.length) * 100).toFixed(1) : 0}%
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-4 text-left">
                                <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest text-left">Latest Successes</h4>
                                {companies.filter(c => c.leadId).slice(0, 3).map(c => (
                                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 text-left">
                                        <div className="bg-green-100 p-1.5 rounded-full"><CheckCircle2 className="h-4 w-4 text-green-600" /></div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <p className="text-sm font-bold truncate text-left">{c.companyName}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase text-left">{c.membershipId || 'Free'} Plan</p>
                                        </div>
                                    </div>
                                ))}
                                {companies.filter(c => c.leadId).length === 0 && (
                                    <p className="text-xs text-center text-muted-foreground py-4 italic text-left">Awaiting first lead conversion...</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="text-left">
                        <Button variant="ghost" className="w-full text-[10px] uppercase font-bold tracking-widest" asChild>
                            <Link href="/adminaccount?view=unified-directory">Unified Registry <ArrowRight className="ml-2 h-3 w-3"/></Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}