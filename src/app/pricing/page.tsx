'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star, ShieldCheck, Zap } from 'lucide-react';
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
        name: 'Free Access',
        price: 0,
        description: 'Perfect for light browsing and exploration.',
        features: [
            "1 Search per day",
            "View up to 10 records",
            "Basic company details (Name, Location)",
            "Access to the community mall",
        ],
        cta: "Start Searching for Free",
        variant: "outline"
    },
    {
        id: 'intelligence',
        name: 'Intelligence Membership',
        price: 100,
        isPopular: true,
        description: 'Complete access to the South African industrial map.',
        features: [
            "Unlimited Daily Searches",
            "Unlimited Record Access",
            "Full Human Contact Data (CEOs/MDs)",
            "Direct E-mail & Mobile Numbers",
            "Unlock Wallet & Transaction Tools",
            "Create & Publish Your Shop",
            "Request Funding via Platform",
            "Priority Support & Compliance",
        ],
        cta: "Get Full Access",
        variant: "default"
    }
  ];

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">SIMPLE PRICING</Badge>
          <h1 className="text-4xl md:text-6xl font-black font-headline">Unlock Your Opportunity Flow</h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground">
            Switch to the Intelligence Membership to unlock thousands of verified leads and start transacting with the community.
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
                            Most Popular Access
                        </div>
                    )}
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                        <CardDescription className="mt-2 text-sm h-12">{plan.description}</CardDescription>
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
                                <li key={i} className="flex items-start">
                                    <Check className="h-5 w-5 text-green-500 mr-3 shrink-0" />
                                    <span className="text-sm font-medium">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter className="pt-6">
                        <Button asChild className="w-full py-6 text-lg font-bold" variant={plan.variant as any}>
                            <Link href={plan.id === 'free' ? (user ? '/account' : '/join') : `/checkout/intelligence`}>
                                {plan.cta}
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
        
        <div className="mt-20 max-w-3xl mx-auto">
             <Alert className="bg-primary/5 border-primary/20 p-6">
                <ShieldCheck className="h-6 w-6 text-primary" />
                <AlertTitle className="text-lg font-bold ml-2">Why R100?</AlertTitle>
                <AlertDescription className="mt-2 text-muted-foreground ml-2">
                    We believe the biggest constraint to growth in the transport sector is the "Information Divide." By keeping the barrier to entry extremely low, we empower thousands of businesses to find the right partners, save on costs, and unlock capital. Your R100 supports the constant AI discovery of new verified leads for the entire community.
                </AlertDescription>
            </Alert>
        </div>
      </div>
    </div>
  );
}