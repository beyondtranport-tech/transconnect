
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { Loader2, Zap, Sparkles, Target, Landmark, Store, DollarSign, ArrowRight, ShieldCheck, Info, BarChart3, TrendingUp, Search, CheckCircle2, History, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

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

    // Dynamic Pricing for UI feedback
    const adPricingRef = useMemoFirebase(() => firestore ? doc(firestore, 'configuration', 'adPricing') : null, [firestore]);
    const { data: adPricing } = useDoc<any>(adPricingRef);

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
        if (budget < (adPricing?.minBudget || 500)) {
            toast({ variant: 'destructive', title: "Budget Too Low", description: `Minimum broadcast budget is ${formatCurrency(adPricing?.minBudget || 500)}.` });
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

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Payment failed.");

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
        { 
            header: 'Campaign Label', 
            cell: ({row}) => (
                <div className="flex flex-col text-left">
                    <span className="font-bold text-foreground">{row.original.title}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-mono">{row.original.id}</span>
                </div>
            )
        },
        { 
            header: 'Target Audience', 
            cell: ({row}) => <Badge variant="outline" className="capitalize text-[10px] font-bold">{row.original.targetAudience}</Badge> 
        },
        { 
            header: 'Spend', 
            cell: ({row}) => <span className="font-black text-primary">{formatCurrency(row.original.budget)}</span> 
        },
        { 
            header: 'Status', 
            cell: ({row}) => (
                <Badge variant={row.original.status === 'active' ? 'default' : 'secondary'} className="capitalize text-[10px] font-black">
                    {row.original.status || 'Draft'}
                </Badge>
            )
        },
        { 
            header: 'Yield (Clicks)', 
            cell: ({row}) => (
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 w-fit">
                    <TrendingUp className="h-3 w-3" />
                    {row.original.metrics?.clicks || 0}
                </div>
            ) 
        }
    ];

    if (isUserLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-12 text-left text-foreground">
            <div className="text-left space-y-1">
                <h1 className="text-4xl font-black font-headline tracking-tight text-left">Industrial Promotion Hub</h1>
                <p className="text-muted-foreground text-lg text-left">Maximize your forensic visibility and secure prioritized search rankings.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 text-left">
                <div className="lg:col-span-2 space-y-10 text-left">
                    {/* Mechanism Explanation */}
                    <Card className="border-primary/20 bg-white shadow-xl text-left overflow-hidden">
                        <CardHeader className="bg-slate-900 text-white p-8">
                            <CardTitle className="text-2xl font-black font-headline flex items-center gap-3">
                                <Info className="h-6 w-6 text-primary" />
                                How Forensic Boosting Works
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6 text-left">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2 text-left">
                                    <div className="bg-primary/10 p-2 rounded-lg w-fit"><Search className="h-5 w-5 text-primary"/></div>
                                    <p className="font-bold text-sm">Top of Search</p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">Your digital branch is injected into the #1 slot for all relevant category searches.</p>
                                </div>
                                <div className="space-y-2 text-left">
                                    <div className="bg-primary/10 p-2 rounded-lg w-fit"><ShieldCheck className="h-5 w-5 text-primary"/></div>
                                    <p className="font-bold text-sm">Verified Badge</p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">Boosted nodes receive a clinical "Verified Provider" badge, increasing trust by 45%.</p>
                                </div>
                                <div className="space-y-2 text-left">
                                    <div className="bg-primary/10 p-2 rounded-lg w-fit"><Zap className="h-5 w-5 text-primary"/></div>
                                    <p className="font-bold text-sm">Flash Discovery</p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">Your studio-generated flyers are displayed on the landing pages of your target Malls.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-2xl border-none bg-white text-left">
                        <CardHeader className="bg-slate-50 border-b p-8">
                            <CardTitle className="text-xl flex items-center gap-2 font-black">
                                <Sparkles className="h-5 w-5 text-primary" /> 
                                Launch New Visibility Boost
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="space-y-4 text-left">
                                <Label className="text-[10px] font-black uppercase text-primary tracking-[0.2em] ml-1">1. Campaign Identity</Label>
                                <Input 
                                    value={title} 
                                    onChange={e => setTitle(e.target.value)} 
                                    placeholder="e.g. Scania Spares Visibility Boost - Q4" 
                                    className="h-12 border-2 text-lg font-bold" 
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                                <div className="space-y-4 text-left">
                                    <Label className="text-[10px] font-black uppercase text-primary tracking-[0.2em] ml-1">2. Target Audience</Label>
                                    <Select value={target} onValueChange={setTarget}>
                                        <SelectTrigger className="h-12 border-2 font-bold"><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            {audiences.map(a => <SelectItem key={a.id} value={a.id} className="font-bold">{a.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-4 text-left">
                                    <Label className="text-[10px] font-black uppercase text-primary tracking-[0.2em] ml-1">3. Broadcast Budget (R)</Label>
                                    <Input 
                                        type="number" 
                                        value={budget} 
                                        onChange={e => setBudget(Number(e.target.value))} 
                                        className="h-12 border-2 font-mono text-xl font-black" 
                                    />
                                    <p className="text-[10px] text-muted-foreground italic pl-1">Min. Requirement: {formatCurrency(adPricing?.minBudget || 500)}</p>
                                </div>
                            </div>

                            <div className="space-y-4 text-left">
                                <Label className="text-[10px] font-black uppercase text-primary tracking-[0.2em] ml-1">4. Creative Asset URL</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        value={creativeUrl} 
                                        onChange={e => setCreativeUrl(e.target.value)} 
                                        placeholder="Paste the link from your Asset Gallery..." 
                                        className="h-12 border-2 font-mono text-xs" 
                                    />
                                    <Button variant="outline" className="h-12 border-2 gap-2 font-bold" asChild>
                                        <Link href="/account?view=asset-gallery"><Search className="h-4 w-4" /> Gallery</Link>
                                    </Button>
                                </div>
                            </div>

                            <Alert className="bg-amber-50 border-amber-200">
                                <ShieldCheck className="h-5 w-5 text-amber-600" />
                                <AlertDescription className="text-xs text-amber-800 leading-relaxed text-left font-medium">
                                    Launching a campaign will immediately debit your available balance. All creative assets are reviewed by platform security before being broadcasted to the grid.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                        <CardFooter className="bg-slate-900 border-t p-8 flex justify-between items-center rounded-b-xl text-white">
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Available to Spend</p>
                                <p className="text-2xl font-black text-primary">{formatCurrency(availableBalance)}</p>
                            </div>
                            <Button size="lg" className="h-16 px-12 font-black uppercase tracking-tight shadow-2xl gap-3 text-lg" onClick={handleLaunch} disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="animate-spin h-6 w-6" /> : <Zap className="h-6 w-6 fill-current" />}
                                Launch Visibility Boost
                            </Button>
                        </CardFooter>
                    </Card>

                    <div className="space-y-6 text-left">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 flex items-center gap-2 text-left text-foreground">
                            <History className="h-4 w-4" />
                            Performance & Accounting Ledger
                        </h3>
                        <Card className="border-none shadow-xl bg-white text-left">
                            <CardContent className="pt-6">
                                {isCampaignsLoading ? (
                                    <div className="flex justify-center p-20 text-foreground"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
                                ) : campaigns && campaigns.length > 0 ? (
                                    <DataTable columns={columns} data={campaigns} />
                                ) : (
                                    <div className="py-20 text-center text-foreground opacity-20 border-2 border-dashed rounded-2xl bg-muted/10">
                                        <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                                        <p className="text-xs font-black uppercase tracking-widest text-center">No active yield logs</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="space-y-8 text-left text-foreground">
                    <Card className="bg-slate-900 text-white border-none shadow-2xl p-8 text-left relative overflow-hidden">
                         <div className="absolute -top-4 -right-4 bg-primary/10 w-32 h-32 rounded-full blur-3xl" />
                        <CardHeader className="p-0 mb-6 text-left">
                            <CardTitle className="text-2xl font-black font-headline flex items-center gap-3 text-white">
                                <Sparkles className="text-primary h-8 w-8" />
                                Content Studio
                            </CardTitle>
                            <CardDescription className="text-slate-400 mt-2 text-left">
                                Produce high-fidelity narrative assets for your Visibility Boost.
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="p-0">
                            <Button asChild className="w-full font-black uppercase text-xs tracking-[0.2em] h-12 shadow-lg" variant="secondary">
                                <Link href="/account?view=marketing-studio">Open Creative Suite <ArrowRight className="ml-2 h-4 w-4"/></Link>
                            </Button>
                        </CardFooter>
                    </Card>

                    <div className="space-y-4 text-left">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1 text-left">Ecosystem Accounting</Label>
                        <Card className="border-dashed border-2 bg-muted/20 text-left">
                            <CardContent className="p-6 space-y-4 text-left">
                                <div className="flex items-start gap-4 text-left">
                                    <div className="bg-primary/10 p-2 rounded-lg mt-1 text-left text-foreground"><DollarSign className="h-4 w-4 text-primary" /></div>
                                    <div className="text-left text-foreground">
                                        <p className="text-xs font-bold text-foreground text-left">Direct Wallet Settlement</p>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed mt-1 text-left">All visibility spend is debited from your primary wallet. Invoices are generated under account code 4500.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 text-left">
                                    <div className="bg-primary/10 p-2 rounded-lg mt-1 text-left"><TrendingUp className="h-4 w-4 text-primary" /></div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-foreground text-left text-foreground">Yield Verification</p>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed mt-1 text-left">Clicks and landings are verified via the platform interaction API. Yield is updated every 60 minutes.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    
                    <div className="p-6 bg-primary rounded-3xl text-white shadow-xl space-y-4 animate-in fade-in duration-700 text-left">
                        <h4 className="text-sm font-black uppercase tracking-widest text-white/90 text-left">Need a custom plan?</h4>
                        <p className="text-xs leading-relaxed text-white/70 text-left">Strategic high-volume partnerships can be negotiated via the platform Support Desk.</p>
                        <Button variant="secondary" size="sm" className="w-full font-bold h-10 text-left" asChild>
                            <Link href="/account?view=support-chat">Talk to Strategy</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
