'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star, ShieldCheck, ArrowRight, Truck, Loader2, Zap, Gift, Landmark, Warehouse, ShoppingCart, Building2, Network, Fingerprint, Database, LayoutDashboard, Calculator } from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { cn, formatCurrency } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { Separator } from '@/components/ui/separator';
import featuresData from '@/lib/features.json';
import * as React from 'react';

const { featureSections } = featuresData;

/**
 * THE INDUSTRIAL GRID ARCHITECTURE
 * 1. Node Ownership (Foundation) - R10/mo (Claiming identity)
 * 2. Registry Intelligence - R100/mo (Global Directory Contacts)
 * 3. Mall Intelligence - Specialized Earning Nodes (Deep Data)
 * 4. Transactional App Membership - Operational Tiers (App Access)
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

  // CATEGORIZATION LOGIC
  const nodeOwnership = plans.filter(p => p.id === 'foundation' || p.price === 10);
  const registryIntelligence = plans.filter(p => p.id === 'intelligence' || p.type === 'registry');
  const mallIntelligence = plans.filter(p => p.type === 'mall');
  const globalMemberships = plans.filter(p => p.type === 'global');

  return (
    <div className="bg-background min-h-screen text-left text-foreground">
      <div className="container mx-auto px-4 py-16 md:py-24">
        
        {/* HEADER SECTION */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 font-bold uppercase tracking-widest px-4 py-1">Ecosystem Economics</Badge>
          <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tight text-foreground">Intelligence that pays.</h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground leading-relaxed text-center">
            Logistics Flow is a modular ecosystem. Establish your <strong>Foundation</strong> in the registry, or activate specialized <strong>Intelligence Nodes</strong> to scale your operations.
          </p>
        </div>

        {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <Loader2 className="animate-spin h-12 w-12 text-primary mx-auto" />
                <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Synchronizing Industrial Grid...</p>
            </div>
        ) : (
            <div className="space-y-32 max-w-7xl mx-auto">
                
                {/* 1. NODE OWNERSHIP (FOUNDATION) */}
                <div className="space-y-10">
                    <div className="flex items-center gap-4 border-l-4 border-slate-300 pl-6 text-left">
                        <div className="text-left">
                            <h2 className="text-3xl font-black uppercase tracking-tight">1. Node Ownership (Foundation)</h2>
                            <p className="text-muted-foreground text-sm font-medium">Binding your digital identity to the registry for reputation management.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {nodeOwnership.map((plan) => (
                            <PlanCard key={plan.id} plan={{...plan, icon: Fingerprint}} user={user} />
                        ))}
                    </div>
                </div>

                {/* 2. REGISTRY INTELLIGENCE */}
                <div className="space-y-10">
                    <div className="flex items-center gap-4 border-l-4 border-primary pl-6 text-left">
                        <div className="text-left">
                            <h2 className="text-3xl font-black uppercase tracking-tight">2. Registry Intelligence</h2>
                            <p className="text-muted-foreground text-sm font-medium">Global dataset access. Direct lines to over 22,000 industry decision-makers.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {registryIntelligence.map((plan) => (
                            <PlanCard key={plan.id} plan={{...plan, icon: Database}} user={user} />
                        ))}
                    </div>
                </div>

                {/* 3. MALL INTELLIGENCE NODES */}
                <div className="space-y-10">
                    <div className="flex items-center gap-4 border-l-4 border-amber-500 pl-6 text-left">
                        <div className="text-left">
                            <h2 className="text-3xl font-black uppercase tracking-tight">3. Mall Intelligence Nodes</h2>
                            <p className="text-muted-foreground text-sm font-medium">Deep-data access to detailed records within specific platform malls.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {mallIntelligence.map((plan) => (
                            <PlanCard key={plan.id} plan={{...plan, icon: Zap}} user={user} />
                        ))}
                    </div>
                </div>

                {/* 4. TRANSACTIONAL APP MEMBERSHIP */}
                <div className="space-y-10">
                    <div className="flex items-center gap-4 border-l-4 border-blue-600 pl-6 text-left">
                        <div className="text-left">
                            <h2 className="text-3xl font-black uppercase tracking-tight">4. Transactional App Membership</h2>
                            <p className="text-muted-foreground text-sm font-medium">Transactional and operational tiers. The power to run your business on the app.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {globalMemberships.map((plan) => (
                            <PlanCard key={plan.id} plan={{...plan, icon: LayoutDashboard}} user={user} />
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* REWARDS SECTION */}
        <div className="mt-32 max-w-4xl mx-auto">
             <Card className="bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Calculator className="h-40 w-40 text-primary" />
                </div>
                <CardContent className="p-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="bg-primary/20 p-6 rounded-3xl border border-primary/30 shrink-0">
                        <ShieldCheck className="h-12 w-12 text-primary" />
                    </div>
                    <div className="space-y-4 text-left flex-1 text-white">
                        <Badge className="bg-primary text-white border-none uppercase font-black text-[10px] tracking-widest">Rewards Integration</Badge>
                        <h3 className="text-3xl font-black font-headline leading-tight">Data as a Platform Currency</h3>
                        <p className="text-slate-400 text-lg leading-relaxed">
                            Don't want to pay cash for Intelligence? Contribute your verified fleet data (RC1) or supplier lists to earn **Reward Points** used to pay for any node.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-4 text-left">
                            <Button asChild size="lg" className="h-14 px-10 font-black uppercase tracking-widest shadow-xl text-white">
                                <Link href="/contribute">Start Contributing <ArrowRight className="ml-2 h-4 w-4"/></Link>
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
    const Icon = plan.icon || Zap;

    // Resolve feature labels from the registry
    const resolvedFeatures = React.useMemo(() => {
        const allFlatFeatures = featureSections.flatMap(s => s.features);
        return (plan.features || []).map((fKey: string) => {
            const found = allFlatFeatures.find(feat => feat.key === fKey);
            return found ? found.name : fKey;
        });
    }, [plan.features]);
    
    return (
        <Card className={cn(
            "flex flex-col shadow-xl transition-all duration-300 relative border-none overflow-hidden h-full text-left",
            plan.isPopular ? "ring-4 ring-primary ring-offset-4 scale-[1.02] z-10" : "bg-white",
        )}>
            {plan.isPopular && (
                <div className="absolute top-0 right-0 bg-primary text-white px-6 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-bl-2xl z-20">
                    Most Active
                </div>
            )}
            <CardHeader className="p-8 pb-6 text-left text-foreground">
                <div className="bg-muted p-3 rounded-xl w-fit mb-4 text-left">
                    <Icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl font-black tracking-tight text-left text-foreground">{plan.name}</CardTitle>
                <CardDescription className="mt-2 text-sm font-medium text-slate-500 leading-relaxed min-h-[40px] text-left">{plan.description}</CardDescription>
                <div className="pt-8">
                    <div className="flex items-baseline gap-1.5 text-left text-foreground">
                        <span className="text-4xl font-black text-slate-900 tracking-tighter">{formatCurrency(plan.price).split('.')[0]}</span>
                        <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">/ month</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow p-8 pt-0 space-y-6 text-left text-foreground">
                <Separator />
                <ul className="space-y-4 text-left">
                    {resolvedFeatures.map((feature: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-left">
                            <Check className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-tight leading-tight text-left">{feature}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter className="p-8 pt-0 text-left">
                <Button asChild className="w-full h-12 text-xs font-black uppercase tracking-widest shadow-lg group text-white" variant={plan.price === 0 ? "outline" : "default"}>
                    <Link href={plan.price === 0 ? (user ? '/account' : '/join') : (plan.id === 'claim-node' ? '/account?view=unified-directory' : `/checkout/${plan.id}`)}>
                        {plan.price === 0 ? 'Explore Free' : (plan.id === 'claim-node' ? 'Claim My Node' : 'Activate Access')}
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
