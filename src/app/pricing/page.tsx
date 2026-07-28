'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ArrowRight, Loader2, Zap, ShieldCheck, Database, Search, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { cn, formatCurrency } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { Separator } from '@/components/ui/separator';
import * as React from 'react';

/**
 * SIMPLIFIED PRICING MODEL
 * Two primary paths for the user: Intelligence or Transactional.
 */

export default function MembershipPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const membershipsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'memberships'));
  }, [firestore]);
  
  const { data: dbPlans, isLoading } = useCollection(membershipsQuery);

  const plans = React.useMemo(() => {
    if (!dbPlans) return [];
    return dbPlans.map(p => ({
        ...p,
        price: typeof p.price === 'number' ? p.price : (p.price?.monthly || 0)
    })).sort((a,b) => a.price - b.price);
  }, [dbPlans]);

  // Simplify into two main tiers for marketing
  const intelligencePlan = plans.find(p => p.id === 'intelligence' || p.price === 100);
  const corePlan = plans.find(p => p.id === 'standard' || p.price === 500);

  return (
    <div className="bg-background min-h-screen text-left text-foreground">
      <div className="container mx-auto px-4 py-16 md:py-24">
        
        {/* HEADER SECTION */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 font-bold uppercase tracking-widest px-4 py-1">Node Activation</Badge>
          <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tight text-foreground uppercase italic leading-none text-center">Intelligence <br/>That Pays.</h1>
          <p className="mt-6 text-xl text-muted-foreground leading-relaxed text-center font-medium">
            Activate your digital standing in the industrial grid. Choose the path that matches your growth goals.
          </p>
        </div>

        {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <Loader2 className="animate-spin h-12 w-12 text-primary mx-auto" />
                <p className="text-sm font-black uppercase tracking-widest text-muted-foreground text-center">Mapping Pricing Tiers...</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto items-stretch text-left">
                
                {/* 1. THE MAP (INTELLIGENCE) */}
                {intelligencePlan && (
                    <Card className="flex flex-col shadow-2xl transition-all duration-300 relative border-none overflow-hidden h-full bg-white text-left">
                        <CardHeader className="p-10 pb-8 text-left bg-slate-50 border-b">
                            <div className="bg-muted p-4 rounded-2xl w-fit mb-6 text-left shadow-inner">
                                <Database className="h-8 w-8 text-primary" />
                            </div>
                            <CardTitle className="text-3xl font-black tracking-tight text-left uppercase">The Map</CardTitle>
                            <CardDescription className="mt-2 text-lg font-bold text-slate-500 leading-relaxed text-left">
                                {intelligencePlan.description}
                            </CardDescription>
                            <div className="pt-10 text-left">
                                <div className="flex items-baseline gap-1.5 text-left text-foreground">
                                    <span className="text-5xl font-black text-slate-900 tracking-tighter">{formatCurrency(intelligencePlan.price).split('.')[0]}</span>
                                    <span className="text-slate-400 font-black uppercase text-xs tracking-widest">/ month</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow p-10 space-y-6 text-left">
                            <ul className="space-y-5 text-left">
                                <li className="flex items-start gap-4 text-left">
                                    <Check className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
                                    <span className="text-sm font-bold text-slate-700 uppercase tracking-tight text-left">Full direct Line to 22,000+ CEO/MDs</span>
                                </li>
                                <li className="flex items-start gap-4 text-left">
                                    <Check className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
                                    <span className="text-sm font-bold text-slate-700 uppercase tracking-tight text-left">Unlimited Registry Search</span>
                                </li>
                                <li className="flex items-start gap-4 text-left">
                                    <Check className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
                                    <span className="text-sm font-bold text-slate-700 uppercase tracking-tight text-left">Verified Mobile Numbers</span>
                                </li>
                                <li className="flex items-start gap-4 opacity-50 text-left">
                                    <Check className="h-5 w-5 shrink-0 mt-0.5 text-slate-300" />
                                    <span className="text-sm font-medium text-slate-400 line-through text-left">Access Earning Mall Nodes</span>
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter className="p-10 pt-0 text-left">
                            <Button asChild className="w-full h-16 text-lg font-black uppercase tracking-widest shadow-xl group text-white border-b-4 border-green-800 active:border-b-0">
                                <Link href={`/checkout/intelligence`}>
                                    Unlock the Map <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                {/* 2. THE ENGINE (TRANSACTIONAL) */}
                {corePlan && (
                    <Card className="flex flex-col shadow-2xl transition-all duration-300 relative border-none overflow-hidden h-full bg-slate-900 text-white text-left ring-8 ring-primary/20">
                        <div className="absolute top-0 right-0 bg-primary text-white px-8 py-2 text-[10px] font-black uppercase tracking-widest rounded-bl-3xl z-20 shadow-lg">
                            Recommended Path
                        </div>
                        <CardHeader className="p-10 pb-8 text-left bg-slate-950 border-b border-white/5">
                            <div className="bg-primary/20 p-4 rounded-2xl w-fit mb-6 text-left border border-primary/30">
                                <Zap className="h-8 w-8 text-primary fill-current" />
                            </div>
                            <CardTitle className="text-3xl font-black tracking-tight text-left uppercase text-white">The Engine</CardTitle>
                            <CardDescription className="mt-2 text-lg font-bold text-slate-400 leading-relaxed text-left">
                                {corePlan.description}
                            </CardDescription>
                            <div className="pt-10 text-left">
                                <div className="flex items-baseline gap-1.5 text-left text-white">
                                    <span className="text-5xl font-black text-white tracking-tighter">{formatCurrency(corePlan.price).split('.')[0]}</span>
                                    <span className="text-slate-500 font-black uppercase text-xs tracking-widest">/ month</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow p-10 space-y-6 text-left">
                            <ul className="space-y-5 text-left">
                                <li className="flex items-start gap-4 text-left">
                                    <Check className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
                                    <span className="text-sm font-bold text-slate-100 uppercase tracking-tight text-left">Full access to all industrial Malls</span>
                                </li>
                                <li className="flex items-start gap-4 text-left">
                                    <Check className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
                                    <span className="text-sm font-bold text-slate-100 uppercase tracking-tight text-left">AI Matching Engine Enabled</span>
                                </li>
                                <li className="flex items-start gap-4 text-left">
                                    <Check className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
                                    <span className="text-sm font-bold text-slate-100 uppercase tracking-tight text-left">Direct Path to in-house Funding</span>
                                </li>
                                <li className="flex items-start gap-4 text-left">
                                    <Check className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
                                    <span className="text-sm font-bold text-slate-100 uppercase tracking-tight text-left">Create & Publish Shop Profile</span>
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter className="p-10 pt-0 text-left">
                            <Button asChild className="w-full h-16 text-lg font-black uppercase tracking-widest shadow-xl group text-white bg-primary hover:bg-primary/90 border-b-4 border-green-800 active:border-b-0">
                                <Link href={`/checkout/standard`}>
                                    Activate the Engine <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                )}
            </div>
        )}

        {/* REWARDS FOOTER */}
        <div className="mt-32 max-w-3xl mx-auto p-12 border-4 border-dashed rounded-[3rem] bg-muted/20 text-center">
            <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-6" />
            <h3 className="text-3xl font-black uppercase tracking-tight mb-4 text-center">Zero Cash Activation</h3>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 text-center">
                If you choose not to pay with ZAR, you can pay with **Data**. <br/>
                Contribute your verified fleet data (RC1) to earn points and activate any node for free.
            </p>
            <Button asChild variant="outline" size="lg" className="font-black uppercase tracking-widest border-2">
                <Link href="/contribute">Contribute & Earn</Link>
            </Button>
        </div>
      </div>
    </div>
  );
}
