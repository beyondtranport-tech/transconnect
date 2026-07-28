'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ArrowRight, Loader2, Zap, ShieldCheck, Database, Search, LayoutDashboard, ShoppingBasket } from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { cn, formatCurrency } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { Separator } from '@/components/ui/separator';
import * as React from 'react';

/**
 * CORE MEMBERSHIP PATHS
 * Framed around "Finding Leads" (Intelligence) and "Active Trading" (Operator).
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

  const intelligencePlan = plans.find(p => p.id === 'intelligence' || p.price === 100);
  const corePlan = plans.find(p => p.id === 'standard' || p.price === 500);

  return (
    <div className="bg-background min-h-screen text-left text-foreground">
      <div className="container mx-auto px-4 py-16 md:py-24 text-left">
        
        {/* HEADER SECTION */}
        <div className="text-center max-w-3xl mx-auto mb-20 text-left md:text-center">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 font-bold uppercase tracking-widest px-4 py-1">Commercial Access</Badge>
          <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tight text-foreground uppercase leading-none">One Hub. <br/>Two Paths.</h1>
          <p className="mt-6 text-xl text-muted-foreground leading-relaxed font-medium">
            Choose how you want to engage with the industrial grid. Start by finding leads or launch your full digital branch.
          </p>
        </div>

        {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <Loader2 className="animate-spin h-12 w-12 text-primary mx-auto" />
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Synchronizing Pricing Ledger...</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto items-stretch text-left">
                
                {/* 1. LEAD DISCOVERY (INTELLIGENCE) */}
                {intelligencePlan && (
                    <Card className="flex flex-col shadow-2xl transition-all duration-300 relative border-none overflow-hidden h-full bg-white text-left">
                        <CardHeader className="p-10 pb-8 text-left bg-slate-50 border-b">
                            <div className="bg-muted p-4 rounded-2xl w-fit mb-6 text-left shadow-inner">
                                <Search className="h-8 w-8 text-primary" />
                            </div>
                            <CardTitle className="text-3xl font-black tracking-tight text-left uppercase">Lead Discovery</CardTitle>
                            <CardDescription className="mt-2 text-lg font-bold text-slate-500 leading-relaxed text-left">
                                Find exactly who to sell to. The map to 22,000+ verified industrial stakeholders.
                            </CardDescription>
                            <div className="pt-10 text-left">
                                <div className="flex items-baseline gap-1.5 text-left text-foreground">
                                    <span className="text-5xl font-black text-slate-900 tracking-tighter">{formatCurrency(intelligencePlan.price).split('.')[0]}</span>
                                    <span className="text-slate-400 font-black uppercase text-xs tracking-widest">/ month</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow p-10 space-y-6 text-left">
                            <ul className="space-y-5 text-left text-foreground">
                                <li className="flex items-start gap-4 text-left text-foreground">
                                    <Check className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
                                    <span className="text-sm font-bold text-slate-700 uppercase tracking-tight text-left">Reveal Direct MD/CEO Contacts</span>
                                </li>
                                <li className="flex items-start gap-4 text-left text-foreground">
                                    <Check className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
                                    <span className="text-sm font-bold text-slate-700 uppercase tracking-tight text-left">Unlimited Forensic Search</span>
                                </li>
                                <li className="flex items-start gap-4 text-left text-foreground">
                                    <Check className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
                                    <span className="text-sm font-bold text-slate-700 uppercase tracking-tight text-left">Verified Mobile & Email Data</span>
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter className="p-10 pt-0 text-left">
                            <Button asChild className="w-full h-16 text-lg font-black uppercase tracking-widest shadow-xl group text-white border-b-4 border-green-800 active:border-b-0">
                                <Link href={`/checkout/intelligence`}>
                                    Activate Discovery <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                {/* 2. ACTIVE TRADING (OPERATOR) */}
                {corePlan && (
                    <Card className="flex flex-col shadow-2xl transition-all duration-300 relative border-none overflow-hidden h-full bg-slate-900 text-white text-left ring-8 ring-primary/20">
                        <div className="absolute top-0 right-0 bg-primary text-white px-8 py-2 text-[10px] font-black uppercase tracking-widest rounded-bl-3xl z-20 shadow-lg">
                            Most Powerful
                        </div>
                        <CardHeader className="p-10 pb-8 text-left bg-slate-950 border-b border-white/5">
                            <div className="bg-primary/20 p-4 rounded-2xl w-fit mb-6 text-left border border-primary/30">
                                <ShoppingBasket className="h-8 w-8 text-primary fill-current" />
                            </div>
                            <CardTitle className="text-3xl font-black tracking-tight text-left uppercase text-white">Active Trading</CardTitle>
                            <CardDescription className="mt-2 text-lg font-bold text-slate-400 leading-relaxed text-left">
                                Launch your digital branch. Transact, post loads, and access growth capital.
                            </CardDescription>
                            <div className="pt-10 text-left">
                                <div className="flex items-baseline gap-1.5 text-left text-white">
                                    <span className="text-5xl font-black text-white tracking-tighter">{formatCurrency(corePlan.price).split('.')[0]}</span>
                                    <span className="text-slate-500 font-black uppercase text-xs tracking-widest">/ month</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow p-10 space-y-6 text-left">
                            <ul className="space-y-5 text-left text-foreground">
                                <li className="flex items-start gap-4 text-left">
                                    <Check className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
                                    <span className="text-sm font-bold text-slate-100 uppercase tracking-tight text-left">Publish Professional Shop Profile</span>
                                </li>
                                <li className="flex items-start gap-4 text-left">
                                    <Check className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
                                    <span className="text-sm font-bold text-slate-100 uppercase tracking-tight text-left">Full access to Load & Carrier Boards</span>
                                </li>
                                <li className="flex items-start gap-4 text-left">
                                    <Check className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
                                    <span className="text-sm font-bold text-slate-100 uppercase tracking-tight text-left">Direct Path to In-House Funding</span>
                                </li>
                                <li className="flex items-start gap-4 text-left">
                                    <Check className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
                                    <span className="text-sm font-bold text-slate-100 uppercase tracking-tight text-left">AI Content & Branding Studio</span>
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter className="p-10 pt-0 text-left">
                            <Button asChild className="w-full h-16 text-lg font-black uppercase tracking-widest shadow-xl group text-white bg-primary hover:bg-primary/90 border-b-4 border-green-800 active:border-b-0">
                                <Link href={`/checkout/standard`}>
                                    Activate My Node <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                )}
            </div>
        )}

        {/* CONNECT ADD-ONS SECTION */}
        <div className="mt-32 max-w-5xl mx-auto space-y-10 text-left text-foreground">
             <div className="text-left space-y-2 text-foreground">
                <h3 className="text-2xl font-black uppercase text-foreground">The Connect Boosters</h3>
                <p className="text-muted-foreground">Enhance your membership with optional boosters revealed through your transaction workflow.</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <Card className="p-6 border-2 border-slate-100 shadow-sm text-left">
                    <Badge className="bg-primary/10 text-primary mb-4">Loyalty</Badge>
                    <h4 className="font-bold text-lg mb-2">The Loyalty Plan</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">Unlock community-negotiated discounts on tires, fuel, and parts.</p>
                    <Link href="/connect/loyalty" className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1">Learn More <ArrowRight className="h-3 w-3"/></Link>
                </Card>
                <Card className="p-6 border-2 border-slate-100 shadow-sm text-left">
                    <Badge className="bg-primary/10 text-primary mb-4">Rewards</Badge>
                    <h4 className="font-bold text-lg mb-2">The Rewards Plan</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">Earn points on every transaction and redeem for fuel or services.</p>
                    <Link href="/connect/rewards" className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1">Learn More <ArrowRight className="h-3 w-3"/></Link>
                </Card>
                <Card className="p-6 border-2 border-slate-100 shadow-sm text-left">
                    <Badge className="bg-primary/10 text-primary mb-4">Revenue</Badge>
                    <h4 className="font-bold text-lg mb-2">The Actions Plan</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">Monetize your network by earning recurring revenue from referrals.</p>
                    <Link href="/connect/actions" className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1">Learn More <ArrowRight className="h-3 w-3"/></Link>
                </Card>
             </div>
        </div>
      </div>
    </div>
  );
}
