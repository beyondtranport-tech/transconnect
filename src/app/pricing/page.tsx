'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star, ShieldCheck, ArrowRight, Search, Truck, Handshake, Loader2, ShoppingCart, Zap, Landmark, Warehouse, Info } from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { cn, formatCurrency } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import * as React from 'react';

/**
 * DEFAULT PLANS (FALLBACK)
 * Used if the Firestore collection is empty.
 */
const defaultPlans = [
    {
        id: 'free',
        name: 'Free Observer',
        price: 0,
        type: 'foundation',
        description: 'Basic visibility into the community mall and registry.',
        features: [
            "1 Search per day",
            "View up to 10 records",
            "Basic company names only",
            "Public Mall access",
        ],
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
        features: [
            "Unlimited Registry Search",
            "Access to 22,000+ Records",
            "Reveal Direct MD/CEO Contacts",
            "Publish Your Digital Branch",
            "Apply for Direct Funding",
        ],
        cta: "Activate Foundation",
        variant: "default" as const
    },
    {
        id: 'loads_intelligence',
        name: 'Loads Intelligence',
        price: 75,
        type: 'earning',
        description: 'The Brokerage Node. Post and take freight loads.',
        features: [
            "Unlock Direct Haulier Contacts",
            "Post Unlimited Loads (Broker)",
            "Take Matching Loads (Haulier)",
            "Access Settlement Ledger",
            "Verified Driver Registry",
        ],
        cta: "Activate Node",
        variant: "default" as const
    },
    {
        id: 'warehouse_intelligence',
        name: 'Warehouse Intelligence',
        price: 125,
        type: 'earning',
        description: 'The Storage Node. Monetize empty space.',
        features: [
            "Unlock Operator Contacts",
            "List Warehouse Capacity",
            "Calculate Handling & Storage Fees",
            "Inbound/Outbound Flow Logic",
            "Integrated VAS Billing",
        ],
        cta: "Activate Node",
        variant: "default" as const
    },
    {
        id: 'buy_sell_intelligence',
        name: 'Buy & Sell Intelligence',
        price: 150,
        type: 'earning',
        description: 'The Marketplace Node. Secure vehicle trading.',
        features: [
            "Unlock Dealer Contacts",
            "List Assets for Sale",
            "Start Secure Handshakes",
            "Generate OTPs & Invoices",
            "Direct Buyer-Seller Chat",
        ],
        cta: "Activate Node",
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

  const plans = React.useMemo(() => {
    // If we have data from Firestore, use it. Otherwise, use defaults.
    if (!dbPlans || dbPlans.length === 0) return defaultPlans;
    
    return dbPlans.map(p => {
        const dPlan = defaultPlans.find(dp => dp.id === p.id);
        return {
            id: p.id,
            name: p.name,
            price: Number(p.price) || 0,
            description: p.description,
            features: p.features || [],
            isPopular: p.isPopular,
            // Logic: if price is low and it's a foundation ID, mark as foundation
            type: (p.id === 'free' || p.id === 'intelligence') ? 'foundation' : 'earning',
            cta: p.id === 'free' ? "Start Free" : (p.id === 'intelligence' ? "Activate Foundation" : "Activate Node"),
            variant: p.id === 'free' ? "outline" : "default"
        };
    }).sort((a,b) => a.price - b.price);
  }, [dbPlans]);

  return (
    <div className="bg-background min-h-screen text-left text-foreground">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 font-bold uppercase tracking-widest px-4 py-1">Business Intelligence</Badge>
          <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tight text-foreground">Intelligence that pays.</h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground leading-relaxed">
            Logistics Flow is a modular ecosystem. Activate the foundation for industrial transparency, or plug in a specialized earning node to scale your operations.
          </p>
        </div>

        {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin h-10 w-10 text-primary" />
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Synchronizing Plan Ledger...</p>
            </div>
        ) : (
            <div className="space-y-24 max-w-7xl mx-auto">
                
                {/* FOUNDATION SECTION */}
                <div className="space-y-10">
                    <div className="flex items-center gap-4 border-l-4 border-primary pl-6 text-left">
                        <div className="text-left text-foreground">
                            <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">The Foundation</h2>
                            <p className="text-muted-foreground text-sm font-medium">Establishing your standing in the national industrial registry.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                        {plans.filter(p => p.type === 'foundation').map((plan) => (
                             <PlanCard key={plan.id} plan={plan} user={user} />
                        ))}
                    </div>
                </div>

                {/* EARNING NODES SECTION */}
                <div className="space-y-10">
                    <div className="flex items-center gap-4 border-l-4 border-amber-500 pl-6 text-left text-foreground">
                        <div className="text-left">
                            <h2 className="text-3xl font-black uppercase tracking-tight text-amber-600">Industrial Earning Nodes</h2>
                            <p className="text-muted-foreground text-sm font-medium">Modular specialized functions. Requires Foundation activation.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {plans.filter(p => p.type === 'earning').map((plan) => (
                             <PlanCard key={plan.id} plan={plan} user={user} />
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* DATA AS CURRENCY CTA */}
        <div className="mt-32 max-w-4xl mx-auto text-left text-foreground">
             <Card className="bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden text-left">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Zap className="h-40 w-40" />
                </div>
                <CardContent className="p-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="bg-primary/20 p-6 rounded-3xl border border-primary/30 shrink-0">
                        <ShieldCheck className="h-12 w-12 text-primary" />
                    </div>
                    <div className="space-y-4 text-left flex-1">
                        <Badge className="bg-primary text-white border-none uppercase font-black text-[10px] tracking-widest">Rewards Integration</Badge>
                        <h3 className="text-3xl font-black font-headline leading-tight">Data as a Platform Currency</h3>
                        <p className="text-slate-400 text-lg leading-relaxed">
                            Don't want to pay cash? Contribute your verified fleet data (RC1) or supplier lists to the community registry to earn **Reward Points**. These points can be redeemed to pay for any Intelligence Node or Connect Plan.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-4">
                            <Button asChild size="lg" className="h-14 px-10 font-black uppercase tracking-widest shadow-xl">
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
                <CardDescription className="mt-2 text-sm font-medium text-slate-500 leading-relaxed min-h-[48px]">{plan.description}</CardDescription>
                <div className="pt-8 text-left">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-5xl font-black text-slate-900 tracking-tighter">{formatCurrency(plan.price).split('.')[0]}</span>
                        <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">/ month</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow p-8 pt-0 space-y-8 text-left">
                <Separator />
                <ul className="space-y-4">
                    {(plan.features as string[]).map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                            <Check className={cn("h-4 w-4 shrink-0 mt-0.5", isEarningNode ? "text-amber-600" : "text-primary")} />
                            <span className="text-sm font-bold text-slate-700 uppercase tracking-tight leading-tight">{feature}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter className="p-8 pt-0 text-left">
                <Button asChild className="w-full h-14 text-sm font-black uppercase tracking-widest shadow-xl group" variant={plan.id === 'free' ? "outline" : "default"}>
                    <Link href={plan.id === 'free' ? (user ? '/account' : '/join') : `/checkout/${plan.id}`}>
                        {plan.cta}
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
