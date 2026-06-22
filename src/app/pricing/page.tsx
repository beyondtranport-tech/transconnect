'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star, ShieldCheck, ArrowRight, Building2, Zap, Search } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { cn, formatCurrency } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import * as React from 'react';

export default function MembershipPage() {
  const { user } = useUser();

  const plans = [
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
        isPopular: true,
        description: 'Full forensic data and industrial intelligence tools.',
        features: [
            "Unlimited Daily Searches",
            "Unlimited Record Access",
            "Full Forensic Data (CEO/MD Names)",
            "Direct E-mails & Mobile Numbers",
            "Create & Publish Your Shop",
            "Unlock Wallet & Billing Tools",
            "Apply for Business Funding",
            "Priority Support & Compliance",
        ],
        cta: "Get Full Access",
        variant: "default" as const
    }
  ];

  return (
    <div className="bg-background min-h-screen text-left">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 font-bold uppercase tracking-widest">Pricing Strategy</Badge>
          <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tight text-center">One Price. Total Intelligence.</h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground text-center">
            Upgrade to the Intelligence Access tier to unlock the direct contacts of decision-makers across the industry.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan) => (
                <Card key={plan.id} className={cn(
                    "flex flex-col shadow-xl transition-all duration-300 relative",
                    plan.isPopular ? "border-primary border-2 scale-105" : "border"
                )}>
                    {plan.isPopular && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 text-xs font-black uppercase rounded-full flex items-center gap-1 z-10">
                            <Star className="h-3 w-3 fill-current" />
                            Recommended Access
                        </div>
                    )}
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                        <CardDescription className="mt-2 text-sm h-12 text-center">{plan.description}</CardDescription>
                        <div className="py-6">
                            <div className="flex items-baseline justify-center gap-1">
                                <span className="text-5xl font-black tracking-tight">{formatCurrency(plan.price)}</span>
                                <span className="text-muted-foreground font-medium">/month</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <ul className="space-y-4">
                            {plan.features.map((feature, i) => (
                                <li key={i} className="flex items-start text-sm">
                                    <Check className="h-4 w-4 text-green-500 mr-3 shrink-0 mt-0.5" />
                                    <span className="font-medium">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter className="pt-6">
                        <Button asChild className="w-full py-6 text-lg font-bold" variant={plan.variant}>
                            <Link href={plan.id === 'free' ? (user ? '/account' : '/join') : `/checkout/intelligence`}>
                                {plan.cta}
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>

        {/* Supplier Specific Value Prop */}
        <div className="mt-24 max-w-5xl mx-auto space-y-12">
            <div className="text-center">
                <h2 className="text-3xl font-black font-headline">Why Suppliers Join</h2>
                <p className="text-muted-foreground mt-2">Intelligence Access isn't just a membership; it's a sales velocity engine.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-4 text-left">
                    <div className="bg-primary/10 p-3 rounded-xl w-fit"><Building2 className="h-6 w-6 text-primary"/></div>
                    <h3 className="text-xl font-bold">Your Digital Branch</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Create a high-fidelity shop profile. Showcase your inventory to a captive community of fleet owners actively searching for your parts.
                    </p>
                </div>
                <div className="space-y-4 text-left">
                    <div className="bg-primary/10 p-3 rounded-xl w-fit"><Search className="h-6 w-6 text-primary"/></div>
                    <h3 className="text-xl font-bold">Forensic Lead Gen</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Search for transporters by region or vehicle type. Get direct access to MD/Owner mobile numbers to bypass generic call-centers.
                    </p>
                </div>
                <div className="space-y-4 text-left">
                    <div className="bg-primary/10 p-3 rounded-xl w-fit"><Zap className="h-6 w-6 text-primary"/></div>
                    <h3 className="text-xl font-bold">Embedded Finance</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Close more deals. Your customers can use their platform wallet or apply for instant funding to buy your products directly.
                    </p>
                </div>
            </div>
        </div>
        
        <div className="mt-20 max-w-3xl mx-auto">
             <Alert className="bg-primary/5 border-primary/20 p-6 text-left text-foreground">
                <ShieldCheck className="h-6 w-6 text-primary" />
                <AlertTitle className="text-lg font-bold ml-2">Why R100?</AlertTitle>
                <AlertDescription className="mt-2 text-muted-foreground ml-2">
                    Our mission is to break the constraint of the "Information Divide." By offering high-quality forensic data for just R100, we enable small and medium enterprises to compete on the same level as industrial giants. Your subscription funds the continuous AI discovery of new verified leads for the whole community.
                </AlertDescription>
            </Alert>
        </div>
      </div>
    </div>
  );
}
