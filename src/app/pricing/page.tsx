'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star, ShieldCheck, ArrowRight, Search, Truck, Handshake, Loader2, ShoppingCart } from 'lucide-react';
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
        description: 'Full forensic data and industrial intelligence tools.',
        features: [
            "Unlimited Daily Searches",
            "Unlimited Record Access",
            "Full Forensic Data (CEO/MD Names)",
            "Direct E-mails & Mobile Numbers",
            "Publish Your Shop Profile",
            "Unlock Wallet & Billing Tools",
        ],
        cta: "Get Full Access",
        variant: "default" as const
    },
    {
        id: 'loads_intelligence',
        name: 'Loads Intelligence',
        price: 75,
        description: 'The Earning Tier. Unlock the ability to post and take freight loads.',
        features: [
            "Everything in Intelligence Access",
            "Post Unlimited Loads as a Broker",
            "Take Loads as a Haulier",
            "Access Subcontractor Handshakes",
            "Verified Fleet & Driver Registry",
            "2.5% Success Fee Participation",
        ],
        cta: "Unlock Earning Power",
        variant: "default" as const
    },
    {
        id: 'buy_sell_intelligence',
        name: 'Buy & Sell Intelligence',
        price: 150,
        isPopular: true,
        description: 'The Marketplace Tier. List vehicles and conclude transactions securely.',
        features: [
            "Everything in Intelligence Access",
            "List Unlimited Vehicles for Sale",
            "Initiate Secure Negotiations",
            "Generate OTPs & Invoices",
            "Direct Buyer-Seller Chat",
            "Integrated Finance Referral",
        ],
        cta: "Unlock Marketplace",
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
        cta: p.id === 'free' ? "Start Free" : "Get Started",
        variant: p.id === 'free' ? "outline" : "default"
    })).sort((a,b) => a.price - b.price);
  }, [dbPlans]);

  return (
    <div className="bg-background min-h-screen text-left">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 font-bold uppercase tracking-widest">Membership Tiers</Badge>
          <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tight text-center">Intelligence that Pays for Itself.</h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground text-center">
            From basic observation to full industrial earning power. Choose the level that matches your growth goals.
          </p>
        </div>

        {isLoading ? (
            <div className="flex justify-center py-20 text-center"><Loader2 className="animate-spin h-10 w-10 text-primary mx-auto"/></div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                {plans.map((plan) => (
                    <Card key={plan.id} className={cn(
                        "flex flex-col shadow-xl transition-all duration-300 relative",
                        plan.isPopular ? "border-primary border-2 scale-105" : "border"
                    )}>
                        {plan.isPopular && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 text-xs font-black uppercase rounded-full flex items-center gap-1 z-10">
                                <Star className="h-3 w-3 fill-current" />
                                Top Rated
                            </div>
                        )}
                        <CardHeader className="text-center pb-2">
                            <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                            <CardDescription className="mt-2 text-sm h-12 text-center leading-tight">{plan.description}</CardDescription>
                            <div className="py-6 text-center">
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-5xl font-black tracking-tight">{formatCurrency(plan.price)}</span>
                                    <span className="text-muted-foreground font-medium">/month</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <ul className="space-y-3">
                                {(plan.features as string[]).map((feature, i) => (
                                    <li key={i} className="flex items-start text-xs">
                                        <Check className="h-3.5 w-3.5 text-green-500 mr-2 shrink-0 mt-0.5" />
                                        <span className="font-medium text-muted-foreground">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter className="pt-6">
                            <Button asChild className="w-full py-6 text-sm font-black uppercase tracking-widest" variant={plan.variant as any}>
                                <Link href={plan.id === 'free' ? (user ? '/account' : '/join') : `/checkout/${plan.id}`}>
                                    {plan.cta}
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        )}

        <div className="mt-24 max-w-5xl mx-auto space-y-12 text-left">
            <div className="text-center">
                <h2 className="text-3xl font-black font-headline">The Earning Pathway</h2>
                <p className="text-muted-foreground mt-2">How our memberships generate direct ROI for your business.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-4 text-left">
                    <div className="bg-primary/10 p-3 rounded-xl w-fit"><Handshake className="h-6 w-6 text-primary"/></div>
                    <h3 className="text-xl font-bold text-left">Brokerage Nodes</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed text-left">
                        The **Loads Intelligence** tier allows you to act as an authorized subcontractor. Map loads you know of and earn a professional split on every delivery.
                    </p>
                </div>
                <div className="space-y-4 text-left">
                    <div className="bg-primary/10 p-3 rounded-xl w-fit"><ShoppingCart className="h-6 w-6 text-primary"/></div>
                    <h3 className="text-xl font-bold text-left">Asset Monetization</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed text-left">
                        List decommissioned trucks or excess inventory in the **Buy & Sell Mall**. Use our secure OTP generator to close deals with verified community buyers.
                    </p>
                </div>
                <div className="space-y-4 text-left">
                    <div className="bg-primary/10 p-3 rounded-xl w-fit"><Search className="h-6 w-6 text-primary"/></div>
                    <h3 className="text-xl font-bold text-left">Forensic Transparency</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed text-left">
                        Access direct mobile numbers for MDs and Fleet Owners. Stop hitting generic support lines and start talking to the people who control the capital.
                    </p>
                </div>
            </div>
        </div>
        
        <div className="mt-20 max-w-3xl mx-auto text-left">
             <Alert className="bg-primary/5 border-primary/20 p-6 text-left text-foreground">
                <ShieldCheck className="h-6 w-6 text-primary" />
                <AlertTitle className="text-lg font-bold ml-2">Data as a Currency</AlertTitle>
                <AlertDescription className="mt-2 text-muted-foreground ml-2 text-left">
                    We incentivize contribution. By registering your fleet (RC1) and contributing supplier data, you earn points that can be used to lower your monthly subscription costs.
                </AlertDescription>
            </Alert>
        </div>
      </div>
    </div>
  );
}
