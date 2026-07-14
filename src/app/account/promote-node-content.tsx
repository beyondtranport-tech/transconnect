
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Loader2, Zap, Sparkles, Target, Landmark, Store, DollarSign, ArrowRight, ShieldCheck, Info, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { collection, query, orderBy } from 'firebase/firestore';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';

const audiences = [
    { id: 'transporters', label: 'Transporters (Registry)', icon: Target },
    { id: 'suppliers', label: 'Suppliers (Registry)', icon: Store },
    { id: 'finance', label: 'Finance Partners', icon: Landmark },
    { id: 'all', label: 'Global Platform', icon: Zap },
];

export default function PromoteNodeContent() {
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();
    const firestore = useFirestore();
    
    const [title, setTitle] = useState('');
    const [target, setTarget] = useState('all');
    const [budget, setBudget] = useState(500);
    const [creativeUrl, setCreativeUrl] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const campaignsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.companyId) return null;
        return query(collection(firestore, `companies/${user.companyId}/adCampaigns`), orderBy('createdAt', 'desc'));
    }, [firestore, user?.companyId]);
    const { data: campaigns, isLoading: isCampaignsLoading, forceRefresh } = useCollection(campaignsQuery);

    const availableBalance = user?.companyData?.availableBalance || 0;

    const handleLaunch = async () => {
        if (!title || !creativeUrl) {
            toast({ variant: 'destructive', title: "Details Required", description: "Please enter a title and attach a creative URL from the Studio." });
            return;
        }
        if (budget > availableBalance) {
            toast({ variant: 'destructive', title: "Insufficient Funds", description: "Top-up your wallet to launch this campaign." });
            return;
        }

        setIsProcessing(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed.");

            const payload = {
                companyId: user.companyId,
                amount: budget,
                description: `Ad Campaign Activation: ${title}`,
                planType: 'ad_broadcast',
                planId: `ad_${Date.now()}`,
                title,
                targetAudience: target,
                creativeUrl
            };

            const response = await fetch('/api/payWithWallet', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error("Payment failed.");

            toast({ title: "Campaign Launched!", description: "Your ad has been submitted for forensic oversight." });
            forceRefresh();
            setTitle('');
            setCreativeUrl('');
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Launch Failed", description: e.message });
        } finally {
            setIsProcessing(false);
        }
    };

    const columns: ColumnDef<any>[] = [
        { accessorKey: 'title', header: 'Campaign' },
        { accessorKey: 'targetAudience', header: 'Audience', cell: ({row}) => <Badge variant="outline" className="capitalize">{row.original.targetAudience}</Badge> },
        { accessorKey: 'budget', header: 'Budget', cell: ({row}) => formatCurrency(row.original.budget) },
        { accessorKey: 'status', header: 'Status', cell: ({row}) => <Badge className="capitalize">{row.original.status || 'Active'}</Badge> },
        { header: 'Performance', cell: ({row}) => <div className="text-[10px] font-bold text-muted-foreground">Clicks: {row.original.metrics?.clicks || 0}</div> }
    ];

    if (isUserLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-8 text-left text-foreground">
            <div className="text-left">
                <h1 className="text-3xl font-black font-headline text-left">Industrial Promotion Hub</h1>
                <p className="text-muted-foreground mt-1">Boost your visibility and secure prioritized search rankings.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="shadow-xl border-primary/20 bg-white">
                        <CardHeader className="bg-slate-50 border-b">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" /> 
                                Configure Visibility Boost
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground">Promotion Title</Label>
                                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Premium Flatbed Availability - Dec 2024" className="h-11 border-2" />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Target Audience</Label>
                                    <Select value={target} onValueChange={setTarget}>
                                        <SelectTrigger className="h-11 border-2"><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            {audiences.map(a => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Broadcast Budget (ZAR)</Label>
                                    <Input type="number" value={budget} onChange={e => setBudget(Number(e.target.value))} className="h-11 border-2 font-mono" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground">Creative URL (from Studio)</Label>
                                <Input value={creativeUrl} onChange={e => setCreativeUrl(e.target.value)} placeholder="Paste the generated asset link here..." className="h-11 border-2 font-mono text-xs" />
                            </div>

                            <Alert className="bg-primary/5 border-primary/20">
                                <Info className="h-5 w-5 text-primary" />
                                <AlertDescription className="text-xs text-muted-foreground">
                                    Boosting your node injects your profile at the top of relevant Mall searches. A "Verified Provider" badge will be added to your record.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                        <CardFooter className="bg-slate-50 border-t p-6 flex justify-between items-center">
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase text-muted-foreground">Available to Spend</p>
                                <p className="text-xl font-black text-foreground">{formatCurrency(availableBalance)}</p>
                            </div>
                            <Button size="lg" className="h-14 px-12 font-black uppercase tracking-tight shadow-xl gap-2" onClick={handleLaunch} disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="animate-spin h-5 w-5" /> : <Zap className="h-5 w-5" />}
                                Launch Promotion
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card className="border-none shadow-xl">
                        <CardHeader className="border-b">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-primary" />
                                Active Promotions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {isCampaignsLoading ? <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div> : <DataTable columns={columns} data={campaigns || []} />}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-slate-900 text-white border-none shadow-2xl">
                        <CardHeader>
                            <CardTitle className="text-xl font-headline flex items-center gap-2">
                                <Sparkles className="text-primary h-6 w-6" />
                                AI Content Studio
                            </CardTitle>
                            <CardDescription className="text-slate-400">Generate your promotional creatives here.</CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Button asChild className="w-full font-bold uppercase text-xs tracking-widest h-12" variant="secondary">
                                <Link href="/account?view=marketing-studio">Open Content Studio <ArrowRight className="ml-2 h-4 w-4"/></Link>
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card className="border-dashed border-2 bg-muted/20">
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-primary" />
                                Visibility Guarantee
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                            <p>Promoted nodes are delivered to targeted sessions based on forensic matching. We ensure your capacity is seen by members with active requirements.</p>
                            <p>Performance metrics are updated every 60 minutes via the platform's interaction tracking API.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
