'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Gavel, Save, Loader2, Info, Landmark, ShieldCheck, TrendingUp, DollarSign, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

export default function PoliciesContent() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isSaving, setIsSaving] = useState(false);

    const configRef = useMemoFirebase(() => firestore ? doc(firestore, 'configuration', 'lendingPolicies') : null, [firestore]);
    const { data: config, isLoading, forceRefresh } = useDoc<any>(configRef);

    const [policies, setPolicies] = useState({
        minTrustScore: 65,
        primeRate: 11.75,
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

            toast({ title: "Business Model Updated", description: "Lending policies are now synchronized grid-wide." });
            forceRefresh();
        } catch (e) {
            toast({ variant: 'destructive', title: "Save Failed" });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 text-left text-foreground">
            <div className="text-left">
                <h1 className="text-3xl font-black font-headline tracking-tight flex items-center gap-3">
                    <Gavel className="h-8 w-8 text-primary" />
                    Lending Model Policies
                </h1>
                <p className="text-muted-foreground mt-1">Define the institutional appetite and financial logic for the capital division.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
                <div className="space-y-8 text-left">
                    <Card className="shadow-xl border-none text-left">
                        <CardHeader className="bg-slate-900 text-white p-6 rounded-t-lg text-left">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Scale className="h-5 w-5 text-primary" /> Risk Appetite
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6 text-left">
                            <div className="space-y-2 text-left">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Minimum Trust Score Threshold</Label>
                                <div className="flex items-center gap-4 text-left">
                                    <Input 
                                        type="number" 
                                        value={policies.minTrustScore} 
                                        onChange={e => setPolicies({...policies, minTrustScore: Number(e.target.value)})}
                                        className="h-12 text-xl font-black border-2 bg-white" 
                                    />
                                    <Badge className="bg-primary text-white py-1.5 px-3">Standard</Badge>
                                </div>
                                <p className="text-[10px] text-muted-foreground italic">Enquiries below this score will be auto-flagged for human exception review.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-xl border-none text-left">
                        <CardHeader className="bg-slate-900 text-white p-6 rounded-t-lg text-left">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" /> Base Rates & Margins
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-8 text-left">
                            <div className="space-y-2 text-left">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Current Prime Rate (%)</Label>
                                <Input 
                                    type="number" 
                                    step="0.25"
                                    value={policies.primeRate} 
                                    onChange={e => setPolicies({...policies, primeRate: Number(e.target.value)})}
                                    className="h-12 text-xl font-black border-2 bg-white" 
                                />
                            </div>
                            <Separator />
                            <div className="grid grid-cols-2 gap-6 text-left">
                                {Object.entries(policies.standardMargins).map(([key, val]) => (
                                    <div key={key} className="space-y-2 text-left">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 capitalize">{key.replace('_', ' ')} Margin (%)</Label>
                                        <Input 
                                            type="number" 
                                            value={val} 
                                            onChange={e => setPolicies({...policies, standardMargins: {...policies.standardMargins, [key]: Number(e.target.value)}})}
                                            className="h-10 font-bold border-2 bg-white" 
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-8 text-left">
                     <Card className="shadow-xl border-none text-left">
                        <CardHeader className="bg-slate-900 text-white p-6 rounded-t-lg text-left">
                            <CardTitle className="text-lg font-bold flex items-center gap-2 text-left">
                                <Landmark className="h-5 w-5 text-primary" /> Target Entity Profiles
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4 text-left">
                            {["Ltd", "Private Company (Pty Ltd)", "Sole Proprietorship", "Trust", "Partnership"].map(type => (
                                <div key={type} className="flex items-center gap-3 p-3 border rounded-xl hover:bg-slate-50 transition-colors text-left cursor-pointer" onClick={() => {
                                    const current = policies.entityTypeAppetite;
                                    const updated = current.includes(type) ? current.filter(t => t !== type) : [...current, type];
                                    setPolicies({...policies, entityTypeAppetite: updated});
                                }}>
                                    <Checkbox checked={policies.entityTypeAppetite.includes(type)} onCheckedChange={() => {}} />
                                    <span className="text-sm font-bold text-foreground">{type}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <div className="p-6 bg-primary/5 border-2 border-dashed border-primary/20 rounded-3xl space-y-4 text-left text-foreground">
                         <div className="flex items-center gap-3 text-left">
                            <Info className="h-5 w-5 text-primary" />
                            <h4 className="font-bold text-sm uppercase text-primary">Policy Synchronization</h4>
                         </div>
                         <p className="text-xs text-muted-foreground leading-relaxed text-left">
                            Updating these policies instantly recalibrates the **Quote Calculator** and the **Auto-Matching Engine** for all members. Ensure your capital division is ready for the volume change before saving.
                         </p>
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 border-t p-8 flex justify-end mt-12 rounded-2xl text-left text-foreground">
                <Button onClick={handleSave} disabled={isSaving} size="lg" className="h-14 px-12 font-black uppercase tracking-widest shadow-2xl text-white">
                    {isSaving ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                    Publish Business Model
                </Button>
            </div>
        </div>
    );
}
