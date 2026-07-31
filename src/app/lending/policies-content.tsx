'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Gavel, Save, Loader2, Info, Landmark, ShieldCheck, TrendingUp, DollarSign, Scale, Building2, Ban, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * LENDING POLICY TERMINAL
 * This is the "Brain" of the capital division.
 * Defines the risk floor, pricing margins, and target entity appetite.
 */
export default function PoliciesContent() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isSaving, setIsSaving] = useState(false);

    const configRef = useMemoFirebase(() => firestore ? doc(firestore, 'configuration', 'lendingPolicies') : null, [firestore]);
    const { data: config, isLoading, forceRefresh } = useDoc<any>(configRef);

    const [policies, setPolicies] = useState({
        minTrustScore: 65,
        primeRate: 11.75,
        minYearsInBusiness: 2,
        minAnnualTurnover: 1000000,
        maxLtvTruck: 85,
        maxLtvTrailer: 90,
        standardMargins: {
            loan: 5,
            installment_sale: 4,
            lease: 4.5,
            factoring: 3
        },
        entityTypeAppetite: ["Ltd", "Private Company (Pty Ltd)", "Sole Proprietorship"]
    });

    useEffect(() => {
        if (config) setPolicies(prev => ({ ...prev, ...config }));
    }, [config]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;

            await fetch('/api/updateConfigDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: 'configuration/lendingPolicies', data: policies })
            });

            toast({ title: "Institutional Model Updated", description: "Vetting logic and matching engine synchronized." });
            forceRefresh();
        } catch (e) {
            toast({ variant: 'destructive', title: "Save Failed" });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="flex justify-center p-40"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 text-left text-foreground">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 text-left">
                <div className="text-left">
                    <h1 className="text-3xl font-black font-headline tracking-tight flex items-center gap-3 text-left">
                        <Gavel className="h-8 w-8 text-primary" />
                        Lending Model Policies
                    </h1>
                    <p className="text-muted-foreground mt-1 text-left">Define the institutional appetite and financial logic for the capital division.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={isSaving} className="h-11 px-8 font-black uppercase text-xs tracking-widest shadow-xl text-white">
                        {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Publish Business Model
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="risk" className="w-full text-left">
                <TabsList className="bg-muted/50 p-1 h-auto flex-wrap justify-start">
                    <TabsTrigger value="risk" className="gap-2 px-6 py-2.5 font-bold uppercase tracking-widest text-[10px]">
                        <Scale className="h-3.5 w-3.5" /> Risk Appetite
                    </TabsTrigger>
                    <TabsTrigger value="pricing" className="gap-2 px-6 py-2.5 font-bold uppercase tracking-widest text-[10px]">
                        <TrendingUp className="h-3.5 w-3.5" /> Yield & Pricing
                    </TabsTrigger>
                    <TabsTrigger value="entities" className="gap-2 px-6 py-2.5 font-bold uppercase tracking-widest text-[10px]">
                        <Building2 className="h-3.5 w-3.5" /> Authorized Profiles
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="risk" className="mt-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="border-none shadow-xl bg-white">
                            <CardHeader className="bg-slate-900 text-white p-6 rounded-t-lg">
                                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-primary" /> Score Thresholds
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Minimum Trust Score (%)</Label>
                                    <Input 
                                        type="number" 
                                        value={policies.minTrustScore} 
                                        onChange={e => setPolicies({...policies, minTrustScore: Number(e.target.value)})}
                                        className="h-12 text-xl font-black border-2" 
                                    />
                                    <p className="text-[10px] text-muted-foreground italic">Enquiries below this threshold require manual Director override.</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-xl bg-white">
                            <CardHeader className="bg-slate-900 text-white p-6 rounded-t-lg">
                                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Scale className="h-5 w-5 text-primary" /> Entity Maturity Floor
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Min Years Trading</Label>
                                        <Input 
                                            type="number" 
                                            value={policies.minYearsInBusiness} 
                                            onChange={e => setPolicies({...policies, minYearsInBusiness: Number(e.target.value)})}
                                            className="h-11 border-2 font-bold" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Min Turnover (ZAR)</Label>
                                        <Input 
                                            type="number" 
                                            value={policies.minAnnualTurnover} 
                                            onChange={e => setPolicies({...policies, minAnnualTurnover: Number(e.target.value)})}
                                            className="h-11 border-2 font-bold" 
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="pricing" className="mt-8 space-y-8">
                    <Card className="border-none shadow-xl bg-white overflow-hidden">
                        <CardHeader className="bg-slate-900 text-white p-6 flex flex-row justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Landmark className="h-6 w-6 text-primary" />
                                <CardTitle className="text-lg font-black uppercase tracking-tight">Institutional Yield Ledger</CardTitle>
                            </div>
                            <div className="bg-primary/20 px-4 py-1.5 rounded-full border border-primary/30">
                                <span className="text-[10px] font-black uppercase text-primary">Prime Base: {policies.primeRate}%</span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-10">
                            <div className="max-w-xs space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Global Prime Rate (%)</Label>
                                <Input 
                                    type="number" 
                                    step="0.25"
                                    value={policies.primeRate} 
                                    onChange={e => setPolicies({...policies, primeRate: Number(e.target.value)})}
                                    className="h-12 text-2xl font-black border-2 border-primary/20 bg-slate-50" 
                                />
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                {Object.entries(policies.standardMargins).map(([key, val]) => (
                                    <div key={key} className="space-y-3 p-6 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 capitalize">{key.replace('_', ' ')}</Label>
                                        <div className="flex items-end gap-1">
                                            <Input 
                                                type="number" 
                                                value={val} 
                                                onChange={e => setPolicies({...policies, standardMargins: {...policies.standardMargins, [key]: Number(e.target.value)}})}
                                                className="h-11 text-xl font-black border-2 bg-white" 
                                            />
                                            <span className="text-xs font-bold text-muted-foreground mb-3">%</span>
                                        </div>
                                        <p className="text-[9px] font-bold text-primary uppercase">Total Rate: {(policies.primeRate + val).toFixed(2)}%</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="entities" className="mt-8">
                    <Card className="border-none shadow-xl bg-white">
                        <CardHeader className="p-8 border-b bg-muted/20">
                            <CardTitle className="text-xl font-bold">Authorized Entity Risk Profiles</CardTitle>
                            <CardDescription>Select the legal structuresauthorized for automated enquiry matching.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {["Ltd", "Private Company (Pty Ltd)", "Sole Proprietorship", "Trust", "Partnership", "Close Corporation (CC)"].map(type => (
                                <div 
                                    key={type} 
                                    className={cn(
                                        "flex items-center gap-3 p-4 border-2 rounded-2xl transition-all cursor-pointer",
                                        policies.entityTypeAppetite.includes(type) ? "border-primary bg-primary/5 shadow-sm" : "border-slate-100 opacity-60 grayscale"
                                    )} 
                                    onClick={() => {
                                        const current = policies.entityTypeAppetite;
                                        const updated = current.includes(type) ? current.filter(t => t !== type) : [...current, type];
                                        setPolicies({...policies, entityTypeAppetite: updated});
                                    }}
                                >
                                    <Checkbox checked={policies.entityTypeAppetite.includes(type)} onCheckedChange={() => {}} />
                                    <span className="text-sm font-bold">{type}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden text-left mt-12">
                <div className="absolute top-0 right-0 p-12 opacity-5"><History className="h-40 w-40 text-primary" /></div>
                <div className="relative z-10 flex items-start gap-6 text-left">
                    <div className="bg-primary/20 p-4 rounded-3xl shrink-0"><Info className="h-8 w-8 text-primary" /></div>
                    <div className="space-y-2 text-left text-white">
                        <h4 className="text-xl font-black uppercase text-left">Policy Synchronization Protocol</h4>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-4xl text-left">
                            These policies serve as the **Credit Brain**. Updating them will instantly change the outputs of all Quote Calculators and Matching Engines across the entire member ecosystem. Ensure institutional liquidity is aligned before publishing.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
