'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star, ShieldCheck, ArrowRight, Search, Truck, Handshake, Loader2, ShoppingCart, Zap, Landmark } from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { cn, formatCurrency } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import * as React from 'react';

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
            "Basic company details only",
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
        description: 'Full forensic data and industrial intelligence tools.',
        features: [
            "Unlimited Daily Searches",
            "Unlimited Record Access",
            "Full Forensic Data (CEO/MD Names)",
            "Direct E-mails & Mobile Numbers",
            "Publish Your Shop Profile",
            "Unlock Wallet & Billing Tools",
        ],
        cta: "Activate Node",
        variant: "default" as const
    },
    {
        id: 'loads_intelligence',
        name: 'Loads Intelligence',
        price: 175,
        type: 'earning',
        description: 'The Brokerage Tier. Unlock the ability to post and take freight loads.',
        features: [
            "Everything in Intelligence Access",
            "Post Unlimited Loads as a Broker",
            "Take Loads as a Haulier",
            "Access Subcontractor Handshakes",
            "Verified Fleet & Driver Registry",
            "Fulfillment & Settlement Ledger",
        ],
        cta: "Activate Node",
        variant: "default" as const
    },
    {
        id: 'buy_sell_intelligence',
        name: 'Buy & Sell Intelligence',
        price: 250,
        isPopular: true,
        type: 'earning',
        description: 'The Marketplace Tier. List vehicles and conclude transactions securely.',
        features: [
            "Everything in Intelligence Access",
            "List Unlimited Vehicles for Sale",
            "Initiate Secure Negotiations",
            "Generate OTPs & Invoices",
            "Direct Buyer-Seller Chat",
            "Integrated Finance Referral",
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
    if (!dbPlans || dbPlans.length === 0) return defaultPlans;
    
    return dbPlans.map(p => ({
        id: p.id,
        name: p.name,
        price: Number(p.price) || 0,
        description: p.description,
        features: p.features || [],
        isPopular: p.isPopular,
        type: p.id === 'free' || p.id === 'intelligence' ? 'foundation' : 'earning',
        cta: "Activate Node",
        variant: p.id === 'free' ? "outline" : "default"
    })).sort((a,b) => a.price - b.price);
  }, [dbPlans]);

  return (
    <div className="bg-background min-h-screen text-left">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 font-bold uppercase tracking-widest px-4 py-1">Ecosystem Nodes</Badge>
          <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tight text-center">Intelligence that Pays for Itself.</h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground text-center">
            Activate the specialized intelligence nodes required for your industrial growth.
          </p>
        </div>

        {isLoading ? (
            <div className="flex justify-center py-20 text-center"><Loader2 className="animate-spin h-10 w-10 text-primary mx-auto"/></div>
        ) : (
            <div className="space-y-16 max-w-7xl mx-auto">
                <div className="space-y-8">
                    <div className="flex items-center gap-4 border-l-4 border-primary pl-6">
                        <div className="text-left">
                            <h2 className="text-2xl font-black uppercase tracking-tight">01. Foundational Intelligence</h2>
                            <p className="text-muted-foreground text-sm">Transparency and registry access for the SA market.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                        {plans.filter(p => p.type === 'foundation').map((plan) => (
                             <PlanCard key={plan.id} plan={plan} user={user} />
                        ))}
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="flex items-center gap-4 border-l-4 border-amber-500 pl-6">
                        <div className="text-left">
                            <h2 className="text-2xl font-black uppercase tracking-tight">02. Industrial Earning Nodes</h2>
                            <p className="text-muted-foreground text-sm">Transactional access for fulfillment, brokerage, and asset sales.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                        {plans.filter(p => p.type === 'earning').map((plan) => (
                             <PlanCard key={plan.id} plan={plan} user={user} />
                        ))}
                    </div>
                </div>
            </div>
        )}

        <div className="mt-32 max-w-5xl mx-auto space-y-12 text-left">
            <div className="text-center">
                <h2 className="text-3xl font-black font-headline">The ROI of Intelligence</h2>
                <p className="text-muted-foreground mt-2">Our nodes are designed to solve specific industrial constraints.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-12">
                <div className="space-y-4 text-left">
                    <div className="bg-primary/10 p-3 rounded-xl w-fit"><Zap className="h-6 w-6 text-primary"/></div>
                    <h3 className="text-xl font-bold text-left">Frictionless Brokerage</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed text-left">
                        Loads Intelligence provides the legal and technical framework to act as a subcontractor. Issue professional instructions and track fulfillment with zero manual paperwork.
                    </p>
                </div>
                <div className="space-y-4 text-left">
                    <div className="bg-primary/10 p-3 rounded-xl w-fit"><ShoppingCart className="h-6 w-6 text-primary"/></div>
                    <h3 className="text-xl font-bold text-left">Secure Liquidity</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed text-left">
                        Buy & Sell Intelligence provides a secure "Handshake Terminal" for vehicle trading. Lock prices, generate OTPs, and initiate funding applications in a single workflow.
                    </p>
                </div>
                <div className="space-y-4 text-left">
                    <div className="bg-primary/10 p-3 rounded-xl w-fit"><Search className="h-6 w-6 text-primary"/></div>
                    <h3 className="text-xl font-bold text-left">Forensic Visibility</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed text-left">
                        Stop hitting gatekeepers. Foundation Intelligence gives you direct mobile numbers for decision-makers at 22,000+ logistics and supply firms.
                    </p>
                </div>
            </div>
        </div>
        
        <div className="mt-20 max-w-3xl mx-auto text-left">
             <Alert className="bg-primary/5 border-primary/20 p-8 rounded-3xl text-left text-foreground">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <div className="ml-4">
                    <AlertTitle className="text-xl font-black uppercase tracking-tight">Data as a Currency</AlertTitle>
                    <AlertDescription className="mt-2 text-muted-foreground leading-relaxed text-left">
                        Logistics Flow is a community-first ecosystem. By contributing your verified fleet data (RC1) or supplier lists, you earn **Reward Points** that can be applied to reduce the cost of any Intelligence Node.
                    </AlertDescription>
                    <Button variant="link" className="p-0 h-auto font-bold mt-4" asChild><Link href="/contribute">Start Contributing <ArrowRight className="ml-1 h-3 w-3"/></Link></Button>
                </div>
            </Alert>
        </div>
      </div>
    </div>
  );
}

function PlanCard({ plan, user }: { plan: any, user: any }) {
    return (
        <Card className={cn(
            "flex flex-col shadow-xl transition-all duration-300 relative border-none overflow-hidden",
            plan.isPopular ? "ring-2 ring-primary ring-offset-2 scale-105" : "bg-slate-50"
        )}>
            {plan.isPopular && (
                <div className="absolute top-0 right-0 bg-primary text-white px-4 py-1 text-[10px] font-black uppercase rounded-bl-xl z-10">
                    Most Active
                </div>
            )}
            <CardHeader className="text-left pb-4">
                <CardTitle className="text-2xl font-black">{plan.name}</CardTitle>
                <CardDescription className="mt-1 text-xs min-h-[40px] leading-relaxed">{plan.description}</CardDescription>
                <div className="pt-6">
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-foreground">{formatCurrency(plan.price)}</span>
                        <span className="text-muted-foreground font-medium text-xs">/month</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow bg-white p-6">
                <ul className="space-y-3">
                    {(plan.features as string[]).map((feature, i) => (
                        <li key={i} className="flex items-start text-[11px] leading-tight">
                            <Check className="h-3.5 w-3.5 text-green-500 mr-2 shrink-0 mt-0.5" />
                            <span className="font-bold text-slate-700 uppercase tracking-tight">{feature}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter className="pt-6 bg-white">
                <Button asChild className="w-full py-6 text-sm font-black uppercase tracking-widest shadow-lg" variant={plan.variant as any}>
                    <Link href={plan.id === 'free' ? (user ? '/account' : '/join') : `/checkout/${plan.id}`}>
                        {plan.cta}
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
