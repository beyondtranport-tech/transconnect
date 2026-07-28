'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ArrowRight, Loader2, Zap, ShieldCheck, Database, Search, LayoutDashboard, ShoppingBasket, Star } from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { cn, formatCurrency } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { Separator } from '@/components/ui/separator';
import * as React from 'react';

/**
 * CORE MEMBERSHIP TIERS: Basic, Standard, Premium
 * Integrated with incremental Intelligence Scans as the value driver.
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

  return (
    <div className="bg-background min-h-screen text-left text-foreground">
      <div className="container mx-auto px-4 py-16 md:py-24 text-left">
        
        <div className="text-center max-w-3xl mx-auto mb-20 text-left md:text-center">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 font-bold uppercase tracking-widest px-4 py-1">Ecosystem Access</Badge>
          <h1 className="text-4xl md:text-7xl font-black font-headline tracking-tight text-foreground uppercase leading-none">Power Tiers.</h1>
          <p className="mt-6 text-xl text-muted-foreground leading-relaxed font-medium">
            Scale your industrial capacity. From forensic intelligence to total market dominance.
          </p>
        </div>

        {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <Loader2 className="animate-spin h-12 w-12 text-primary mx-auto" />
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Synchronizing Commercial Ledger...</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch text-left">
                {plans.map((plan) => (
                    <Card key={plan.id} className={cn(
                        "flex flex-col shadow-xl transition-all duration-300 relative border-none overflow-hidden h-full bg-white text-left",
                        plan.isPopular && "ring-8 ring-primary/10 scale-105 z-10 md:-translate-y-2"
                    )}>
                        {plan.isPopular && (
                            <div className="bg-primary text-white text-[10px] font-black uppercase tracking-widest py-1 px-8 absolute top-4 -right-8 rotate-45 shadow-sm">
                                Best Value
                            </div>
                        )}
                        <CardHeader className="p-8 pb-4 text-left">
                            <CardTitle className="text-2xl font-black tracking-tight text-left uppercase">{plan.name}</CardTitle>
                            <CardDescription className="mt-2 text-sm font-bold text-slate-500 leading-relaxed text-left min-h-[40px]">
                                {plan.description}
                            </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="p-8 pt-0 flex-grow space-y-6 text-left">
                            <div className="py-6 border-y border-slate-100">
                                <div className="flex items-baseline gap-1.5 text-left text-foreground">
                                    <span className="text-4xl font-black text-slate-900 tracking-tighter">{formatCurrency(plan.price).split('.')[0]}</span>
                                    <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">/ month</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-primary font-black uppercase text-[11px] tracking-widest">
                                    <Zap className="h-4 w-4 fill-current" />
                                    {plan.searchLimit === 999999 ? 'Unlimited' : plan.searchLimit} Registry Scans
                                </div>
                                <ul className="space-y-3 text-left">
                                    {(plan.features || []).map((featKey: string) => {
                                        // Simple lookup for feature labels based on keys
                                        const label = featKey.split(':')[1]?.replace(/_/g, ' ') || featKey;
                                        return (
                                            <li key={featKey} className="flex items-start gap-3 text-left">
                                                <Check className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                                                <span className="text-xs font-bold text-slate-700 uppercase tracking-tight text-left">{label}</span>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        </CardContent>
                        
                        <CardFooter className="p-8 bg-slate-50 border-t">
                            <Button asChild className={cn("w-full h-12 font-black uppercase tracking-widest shadow-md group text-white", !plan.isPopular && "bg-slate-800 hover:bg-slate-700")}>
                                <Link href={`/checkout/${plan.id}`}>
                                    Activate {plan.id} <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        )}

        <div className="mt-32 max-w-4xl mx-auto p-10 bg-slate-900 text-white rounded-[3rem] shadow-2xl relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 p-12 opacity-5"><ShieldCheck className="h-40 w-40 text-primary" /></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                <div className="flex-1 space-y-4">
                    <Badge className="bg-primary/20 text-primary border-none">Handshake Verified</Badge>
                    <h3 className="text-3xl font-black uppercase tracking-tight">The Data Dividend.</h3>
                    <p className="text-slate-400 leading-relaxed text-sm">
                        Registration is always free. By establishing your node, you contribute to the community's intelligence. As you operate and share data, you earn reward points that can reduce your membership costs by up to 50%.
                    </p>
                </div>
                <Button asChild variant="outline" className="h-14 px-10 border-white/20 text-white hover:bg-white/10 font-bold uppercase tracking-widest">
                    <Link href="/join">Establish Free Node</Link>
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
