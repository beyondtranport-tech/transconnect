
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star, ShieldCheck, ArrowRight, Truck, Loader2, Zap, Gift, Landmark, Warehouse, ShoppingCart, Building2, Network } from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import { cn, formatCurrency } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { Separator } from '@/components/ui/separator';
import * as React from 'react';

/**
 * THE INDUSTRIAL GRID PRICING
 * Grouped into "The Foundation" (Registry) and "Earning Nodes" (Mall Intelligence).
 */

const defaultPlans = [
    {
        id: 'free',
        name: 'Free Observer',
        price: 0,
        type: 'foundation',
        description: 'Basic visibility into the community mall and registry.',
        features: ["1 Search per day", "View up to 10 records", "Basic company names only", "Public Mall access"],
        cta: "Start Free",
        variant: "outline" as const
    },
    {
        id: 'intelligence',
        name: 'Intelligence Access',
        price: 100,
        type: 'foundation',
        isPopular: true,
        description: 'The foundation for industrial growth. Unlock the map.',
        features: ["Unlimited Registry Search", "Access to 22,000+ Records", "Reveal Direct MD/CEO Contacts", "Publish Your Digital Branch", "Apply for Direct Funding"],
        cta: "Activate Foundation",
        variant: "default" as const
    }
];

export default function MembershipPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const membershipsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'memberships'));
  }, [firestore]);
  
  const { data: dbPlans, isLoading } = useCollection(membershipsQuery);

  const incentivesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'configuration/communityIncentives/active'), limit(5));
  }, [firestore]);
  const { data: incentives } = useCollection(incentivesQuery);

  const plans = React.useMemo(() => {
    if (isLoading && !dbPlans) return [];
    
    if (dbPlans && dbPlans.length > 0) {
        return dbPlans.map(p => {
            const planId = p.id?.toLowerCase() || '';
            let type = p.type;
            if (!type) {
                type = (planId === 'free' || planId === 'intelligence') ? 'foundation' : 'earning';
            }
            
            return {
                id: p.id,
                name: p.name,
                price: typeof p.price === 'number' ? p.price : (p.price?.monthly || 0),
                description: p.description,
                features: p.features || [],
                isPopular: p.isPopular,
                type: type,
                cta: p.id === 'free' ? "Start Free" : (type === 'foundation' ? "Activate Foundation" : "Activate Node"),
                variant: p.id === 'free' ? "outline" : "default"
            };
        }).sort((a,b) => a.price - b.price);
    }

    return defaultPlans;
  }, [dbPlans, isLoading]);

  const foundationPlans = plans.filter(p => p.type === 'foundation');
  const earningPlans = plans.filter(p => p.type === 'earning');

  return (
    <div className="bg-background min-h-screen text-left text-foreground">
      <div className="container mx-auto px-4 py-16 md:py-24">
        
        {/* ACTIVATION BUNDLE HOOK */}
        {incentives && incentives.length > 0 && (
            <div className="max-w-5xl mx-auto mb-20 animate-in fade-in slide-in-from-top-4 duration-1000">
                <div className="bg-slate-900 rounded-[2.5rem] p-1 shadow-2xl">
                    <div className="bg-slate-950 rounded-[2.4rem] p-8 md:p-12 overflow-hidden relative">
                         <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Gift className="h-40 w-40 text-primary" />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                            <div className="flex-1 space-y-6 text-left text-white">
                                <Badge className="bg-primary/20 text-primary border-primary/30 py-1.5 px-6 font-black uppercase tracking-widest text-[10px]">Registry Activation Bonus</Badge>
                                <h2 className="text-3xl md:text-5xl font-black font-headline text-white leading-tight">Join for R100,<br/><span className="text-primary">Get R500 in value.</span></h2>
                                <p className="text-slate-400 text-lg leading-relaxed text-left">
                                    Our Supplier Partners have allocated exclusive **Welcome Gifts** to help you lower your operating costs the moment you establish your handshake.
                                </p>
                            </div>
                            <div className="w-full md:w-80 space-y-3">
                                {incentives.map((inc) => (
                                    <div key={inc.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-colors group">
                                        <div className="bg-primary/20 p-2.5 rounded-lg group-hover:bg-primary transition-colors"><Gift className="h-5 w-5 text-primary group-hover:text-white" /></div>
                                        <div className="text-left">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{inc.supplierName}</p>
                                            <p className="text-xs font-bold text-white leading-tight">{inc.title}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 font-bold uppercase tracking-widest px-4 py-1">Business Intelligence</Badge>
          <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tight text-foreground">Intelligence that pays.</h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground leading-relaxed text-center">
            Logistics Flow is a modular ecosystem. Establish your foundation in the registry, or plug in a specialized earning node to scale your operations.
          </p>
        </div>

        {isLoading && !dbPlans ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center text-foreground">
                <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Synchronizing Plan Ledger...</p>
            </div>
        ) : (
            <div className="space-y-24 max-w-7xl mx-auto text-left">
                
                {/* 1. THE FOUNDATION LAYER */}
                <div className="space-y-10 text-left">
                    <div className="flex items-center gap-4 border-l-4 border-primary pl-6 text-left">
                        <div className="text-left text-foreground">
                            <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">The Foundation</h2>
                            <p className="text-muted-foreground text-sm font-medium">Establishing your standing and visibility in the national industrial registry.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl text-left">
                        {foundationPlans.map((plan) => (
                            <PlanCard key={plan.id} plan={plan} user={user} />
                        ))}
                    </div>
                </div>

                {/* 2. THE EARNING NODE LAYER */}
                {earningPlans.length > 0 && (
                    <div className="space-y-10 text-left text-foreground">
                        <div className="flex items-center gap-4 border-l-4 border-amber-500 pl-6 text-left text-foreground">
                            <div className="text-left">
                                <h2 className="text-3xl font-black uppercase tracking-tight text-amber-600">Industrial Earning Nodes</h2>
                                <p className="text-muted-foreground text-sm font-medium">Modular specialized functions for deep mall intelligence. Requires Foundation standing.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
                            {earningPlans.map((plan) => (
                                <PlanCard key={plan.id} plan={plan} user={user} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}

        <div className="mt-32 max-w-4xl mx-auto text-left text-foreground">
             <Card className="bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden text-left">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Zap className="h-40 w-40" />
                </div>
                <CardContent className="p-10 flex flex-col md:flex-row items-center gap-10 text-left">
                    <div className="bg-primary/20 p-6 rounded-3xl border border-primary/30 shrink-0">
                        <ShieldCheck className="h-12 w-12 text-primary" />
                    </div>
                    <div className="space-y-4 text-left flex-1 text-white">
                        <Badge className="bg-primary text-white border-none uppercase font-black text-[10px] tracking-widest">Rewards Integration</Badge>
                        <h3 className="text-3xl font-black font-headline leading-tight">Data as a Platform Currency</h3>
                        <p className="text-slate-400 text-lg leading-relaxed text-left text-white">
                            Don't want to pay cash? Contribute your verified fleet data (RC1) or supplier lists to the community registry to earn **Reward Points**. These points can be redeemed to pay for any Intelligence Node.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-4 text-left">
                            <Button asChild size="lg" className="h-14 px-10 font-black uppercase tracking-widest shadow-xl text-white">
                                <Link href="/contribute">Start Contributing <ArrowRight className="ml-2 h-4 w-4"/></Link>
                            </Button>
                            <Button variant="outline" asChild className="h-14 px-10 border-white/20 hover:bg-white/10 text-white font-black uppercase">
                                <Link href="/connect/rewards">Learn About Rewards</Link>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

function PlanCard({ plan, user }: { plan: any, user: any }) {
    const isEarningNode = plan.type === 'earning';
    
    return (
        <Card className={cn(
            "flex flex-col shadow-xl transition-all duration-300 relative border-none overflow-hidden text-left",
            plan.isPopular ? "ring-4 ring-primary ring-offset-4 scale-[1.02] z-10" : "bg-white",
            isEarningNode ? "border-t-4 border-t-amber-500" : ""
        )}>
            {plan.isPopular && (
                <div className="absolute top-0 right-0 bg-primary text-white px-6 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-bl-2xl z-20">
                    High Conversion
                </div>
            )}
            <CardHeader className="p-8 text-left pb-6">
                <CardTitle className="text-3xl font-black tracking-tight">{plan.name}</CardTitle>
                <CardDescription className="mt-2 text-sm font-medium text-slate-500 leading-relaxed min-h-[48px] text-left">{plan.description}</CardDescription>
                <div className="pt-8 text-left">
                    <div className="flex items-baseline gap-1.5 text-left text-foreground">
                        <span className="text-5xl font-black text-slate-900 tracking-tighter">{formatCurrency(plan.price).split('.')[0]}</span>
                        <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">/ month</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow p-8 pt-0 space-y-8 text-left">
                <Separator />
                <ul className="space-y-4 text-left">
                    {(plan.features as string[]).map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-left text-foreground">
                            <Check className={cn("h-4 w-4 shrink-0 mt-0.5", isEarningNode ? "text-amber-600" : "text-primary")} />
                            <span className="text-sm font-bold text-slate-700 uppercase tracking-tight leading-tight text-left">{feature}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter className="p-8 pt-0 text-left">
                <Button asChild className="w-full h-14 text-sm font-black uppercase tracking-widest shadow-xl group text-white" variant={plan.id === 'free' ? "outline" : "default"}>
                    <Link href={plan.id === 'free' ? (user ? '/account' : '/join') : `/checkout/${plan.id}`}>
                        {plan.cta}
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
