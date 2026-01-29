
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star, Minus } from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import * as React from 'react';
import { collection, query } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useMemoFirebase } from '@/hooks/use-memo-firebase';
import featuresData from '@/lib/features.json';

const { featureSections } = featuresData;

const formatPrice = (price: number, perMonth = false) => {
    const formatted = new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
    return perMonth ? `${formatted}/month` : formatted;
};

const renderCheckmark = (isIncluded: boolean) => {
    if (isIncluded) {
        return <Check className="h-5 w-5 text-green-500 mx-auto" />;
    }
    return <Minus className="h-5 w-5 text-muted-foreground mx-auto" />;
};

export default function MembershipPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const membershipsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'memberships'));
  }, [firestore]);
  
  const { data: tiers, isLoading } = useCollection(membershipsQuery);

  // Sort tiers: free, basic, standard, premium, etc.
  const sortedTiers = useMemo(() => {
      if (!tiers) return [];
      const order = ['free', 'basic', 'standard', 'professional', 'enterprise', 'premium'];
      return [...tiers].sort((a, b) => {
          const aIndex = order.indexOf(a.id);
          const bIndex = order.indexOf(b.id);
          if (aIndex === -1 && bIndex === -1) return (a.price?.monthly || 0) - (b.price?.monthly || 0);
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
      });
  }, [tiers]);

  const allFeatures = useMemo(() => featureSections.flatMap(s => s.features), []);

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-headline">Choose Your Plan</h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground">
            Select the perfect plan to build your online shop and grow your business. All paid plans include a 30-day money-back guarantee.
          </p>
        </div>

        <div className="flex justify-center items-center gap-4 mb-12">
            <Label htmlFor="billing-switch">Monthly</Label>
            <Switch
                id="billing-switch"
                checked={billingCycle === 'annual'}
                onCheckedChange={(checked) => setBillingCycle(checked ? 'annual' : 'monthly')}
            />
            <Label htmlFor="billing-switch">
                Annual <span className="text-primary font-semibold ml-1">(Save up to 15%)</span>
            </Label>
        </div>

        {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {sortedTiers?.map((tier:any) => {
                  const monthlyPrice = tier.price.monthly || 0;
                  const annualDiscount = tier.annualDiscount || 0;
                  const specialOfferDiscount = tier.specialOfferDiscount || 0;
                  
                  // Base prices before special offer
                  const baseAnnualPrice = monthlyPrice * 12 * (1 - (annualDiscount / 100));
                  
                  // Final prices after special offer
                  const finalMonthlyPrice = monthlyPrice * (1 - (specialOfferDiscount / 100));
                  const finalAnnualPrice = baseAnnualPrice * (1 - (specialOfferDiscount / 100));
                  
                  const priceToShow = billingCycle === 'annual' ? finalAnnualPrice / 12 : finalMonthlyPrice;
                  const originalPriceToShow = billingCycle === 'annual' ? baseAnnualPrice / 12 : monthlyPrice;
                  
                  const isDiscounted = specialOfferDiscount > 0;

                  return (
                    <Card key={tier.id} className={cn(
                        "flex flex-col shadow-lg transition-transform duration-300 hover:scale-105",
                        tier.isPopular ? "border-primary border-2 relative" : "border"
                    )}>
                        {tier.isPopular && (
                            <div className="absolute -top-4 right-4 bg-primary text-primary-foreground px-3 py-1 text-sm font-semibold rounded-full flex items-center gap-1">
                                <Star className="h-4 w-4" />
                                Most Popular
                            </div>
                        )}
                      <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                        <CardDescription className="mt-2 text-base h-12">
                            {tier.id === 'free'
                                ? "Get started by building your shop in draft mode. Upgrade to publish and start selling."
                                : tier.description}
                        </CardDescription>
                        <div className="pt-4">
                           {tier.id === 'free' ? (
                                <span className="text-4xl font-extrabold tracking-tight">Free</span>
                           ) : (
                                <>
                                    <div className="flex items-baseline justify-center gap-2">
                                        {isDiscounted && (
                                            <span className="text-2xl font-medium text-muted-foreground line-through decoration-2">
                                                {formatPrice(originalPriceToShow)}
                                            </span>
                                        )}
                                        <span className="text-4xl font-extrabold tracking-tight">
                                            {formatPrice(priceToShow)}
                                        </span>
                                        <span className="text-muted-foreground self-end">/month</span>
                                    </div>
                                    {billingCycle === 'annual' && (
                                        <p className="text-xs text-muted-foreground mt-1">Billed as {formatPrice(finalAnnualPrice)} per year</p>
                                    )}
                                </>
                           )}
                        </div>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <ul className="space-y-3">
                          {tier.features.slice(0, 5).map((featureKey: string) => {
                            const feature = allFeatures.find(f => f.key === featureKey);
                            return (
                                <li key={featureKey} className="flex items-start">
                                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                                  <span className="text-muted-foreground">{feature?.name || featureKey}</span>
                                </li>
                            )
                          })}
                        </ul>
                      </CardContent>
                      <CardFooter className="p-6">
                        <Button asChild className="w-full" size="lg" variant={tier.isPopular ? 'default' : 'outline'}>
                          <Link href={tier.id === 'free' ? (user ? '/account' : '/join') : `/checkout/${tier.id}?cycle=${billingCycle}`}>
                            {tier.id === 'free' ? (user ? 'Go to Dashboard' : 'Create Free Shop') : `Choose ${tier.name}`}
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  )
              })}
            </div>
        )}
      </div>
      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-headline">Compare Features</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Find the right set of tools to build your online shop and grow your business.
            </p>
          </div>
          <div className="max-w-5xl mx-auto border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-2/5 font-bold text-lg">Features</TableHead>
                  {sortedTiers?.map((tier:any) => (
                    <TableHead key={tier.id} className="text-center font-bold text-lg">{tier.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {featureSections.map((section) => (
                    <React.Fragment key={section.name}>
                        <TableRow className="bg-muted/50">
                            <TableCell colSpan={(sortedTiers?.length || 0) + 1} className="font-semibold text-primary">{section.name}</TableCell>
                        </TableRow>
                        {section.features.map((feature) => (
                            <TableRow key={feature.key}>
                                <TableCell className="font-medium pl-8">{feature.name}</TableCell>
                                {sortedTiers?.map((tier: any) => (
                                     <TableCell key={`${tier.id}-${feature.key}`} className="text-center">
                                        {renderCheckmark(tier.features.includes(feature.key))}
                                     </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
    </div>
  );
}
