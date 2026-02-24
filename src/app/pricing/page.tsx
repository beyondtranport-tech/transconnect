
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star, Minus, Info } from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import * as React from 'react';
import { collection } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useMemoFirebase } from '@/hooks/use-memo-firebase';
import featuresData from '@/lib/features.json';

const { featureSections } = featuresData;

const formatPrice = (price: number, perUnit = false, unit = "month") => {
    if (typeof price !== 'number' || isNaN(price)) return 'R 0';
    
    // Manual formatting to avoid server-client inconsistencies with Intl.
    const parts = price.toFixed(0).toString().split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const formatted = `R ${integerPart}`;

    return perUnit ? `${formatted}/${unit}` : formatted;
};

const formatDate = (dateString: string | undefined) => {
    if (!dateString) return null;
    try {
        const date = new Date(dateString);
        // A simple check for a valid date
        if (isNaN(date.getTime())) return null;
        return date.toLocaleDateString('en-ZA', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    } catch (e) {
        return null;
    }
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
    return collection(firestore, 'memberships');
  }, [firestore]);
  
  const { data: tiers, isLoading, error } = useCollection(membershipsQuery);

  // Sort tiers: free, basic, standard, premium, etc.
  const sortedTiers = useMemo(() => {
      if (!tiers) return [];
      const order = ['free', 'basic', 'standard', 'professional', 'enterprise', 'premium'];
      return [...tiers].sort((a, b) => {
          const aIndex = order.indexOf(a.id);
          const bIndex = order.indexOf(b.id);
          
          const aPrice = a.price || 0;
          const bPrice = b.price || 0;

          if (aIndex === -1 && bIndex === -1) return aPrice - bPrice;
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
      });
  }, [tiers]);
  
  const maxAnnualDiscount = useMemo(() => {
      if (!sortedTiers || sortedTiers.length === 0) {
          return 0;
      }
      // Find the maximum annualDiscount among all tiers
      return Math.max(...sortedTiers.map(tier => tier.annualDiscount || 0));
  }, [sortedTiers]);

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
                Annual
                {maxAnnualDiscount > 0 && (
                    <span className="text-primary font-semibold ml-1">(Save up to {maxAnnualDiscount}%)</span>
                )}
            </Label>
        </div>

        {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>
        ) : error ? (
          <div className="text-center py-20 text-destructive bg-destructive/10 rounded-lg">
            <h3 className="text-xl font-semibold">Could not load Membership Plans</h3>
            <p className="mt-2 text-sm">{error.message}</p>
          </div>
        ) : sortedTiers && sortedTiers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {sortedTiers.map((tier:any) => {
                  const monthlyPrice = tier.price || 0;
                  const annualDiscountPercent = tier.annualDiscount || 0;
                  const specialOfferDiscountPercent = tier.specialOfferDiscount || 0;

                  const isOfferActiveNow = (() => {
                      if (!specialOfferDiscountPercent || specialOfferDiscountPercent <= 0) return false;
                      const now = new Date();
                      const startDate = tier.specialOfferStartDate ? new Date(tier.specialOfferStartDate) : null;
                      const endDate = tier.specialOfferEndDate ? new Date(tier.specialOfferEndDate) : null;
                      if (startDate && now < startDate) return false;
                      if (endDate && now > endDate) return false;
                      return true;
                  })();

                  const monthlyBeforeOffer = monthlyPrice;
                  const monthlyAfterOffer = isOfferActiveNow ? monthlyPrice * (1 - (specialOfferDiscountPercent / 100)) : monthlyPrice;
                  
                  const annualFullPrice = monthlyPrice * 12;
                  const annualAfterStandardDiscount = annualFullPrice * (1 - (annualDiscountPercent / 100));
                  const annualFinal = isOfferActiveNow ? annualAfterStandardDiscount * (1 - (specialOfferDiscountPercent / 100)) : annualAfterStandardDiscount;
                  const annualSavingAmount = annualFullPrice - annualFinal;

                  const stickerSavingAmount = billingCycle === 'annual' ? annualSavingAmount : monthlyBeforeOffer - monthlyAfterOffer;

                  const formattedEndDate = formatDate(tier.specialOfferEndDate);
                  
                  return (
                    <Card key={tier.id} className={cn(
                        "flex flex-col shadow-lg transition-transform duration-300 hover:scale-105 relative overflow-visible",
                        tier.isPopular ? "border-primary border-2" : "border"
                    )}>
                        {isOfferActiveNow && stickerSavingAmount > 0 && (
                            <div className="absolute top-8 -left-4 bg-destructive text-destructive-foreground px-4 py-1.5 text-sm font-bold rounded-r-full shadow-lg transform -rotate-15 z-10">
                                SAVE {formatPrice(stickerSavingAmount)}
                            </div>
                        )}
                        {tier.isPopular && (
                            <div className="absolute -top-4 right-4 bg-primary text-primary-foreground px-3 py-1 text-sm font-semibold rounded-full flex items-center gap-1 z-10">
                                <Star className="h-4 w-4" />
                                Most Popular
                            </div>
                        )}
                      <CardHeader className="text-center pt-8">
                        <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                        <CardDescription className="mt-2 text-base h-12">
                            {tier.id === 'free'
                                ? "Get started by building your shop in draft mode. Upgrade to publish and start selling."
                                : tier.description}
                        </CardDescription>
                        <div className="pt-4 min-h-[120px] flex flex-col justify-center">
                           {tier.id === 'free' ? (
                                <span className="text-4xl font-extrabold tracking-tight">Free</span>
                           ) : billingCycle === 'monthly' ? (
                                <>
                                    {isOfferActiveNow && monthlyBeforeOffer > monthlyAfterOffer ? (
                                        <div className="text-center space-y-1">
                                            <p className="text-base text-muted-foreground">
                                                Was <span className="line-through">{formatPrice(monthlyBeforeOffer, true)}</span>
                                            </p>
                                            {(tier.specialOfferText || '').trim().length > 0 && <p className="text-lg font-semibold text-primary">{tier.specialOfferText}</p>}
                                            <div className="flex items-baseline justify-center gap-2 pt-1">
                                                <span className="text-4xl font-extrabold tracking-tight">{formatPrice(monthlyAfterOffer)}</span>
                                                <span className="text-muted-foreground self-end">/month</span>
                                            </div>
                                            {formattedEndDate && <p className="text-xs text-muted-foreground">Valid until {formattedEndDate}</p>}
                                        </div>
                                    ) : (
                                        <div className="flex items-baseline justify-center gap-2">
                                            <span className="text-4xl font-extrabold tracking-tight">{formatPrice(monthlyPrice)}</span>
                                            <span className="text-muted-foreground self-end">/month</span>
                                        </div>
                                    )}
                                </>
                           ) : (
                                // Annual Billing View
                                <div className="text-center space-y-1">
                                     {isOfferActiveNow && annualFullPrice > annualFinal && (
                                        <p className="text-base text-muted-foreground">
                                            Was <span className="line-through">{formatPrice(annualFullPrice, true, 'year')}</span>
                                        </p>
                                    )}
                                    {(tier.specialOfferText || '').trim().length > 0 && isOfferActiveNow && (
                                      <p className="text-lg font-semibold text-primary">{tier.specialOfferText}</p>
                                    )}
                                    <div className="flex items-baseline justify-center gap-2 pt-1">
                                        <span className="text-4xl font-extrabold tracking-tight">{formatPrice(annualFinal)}</span>
                                        <span className="text-muted-foreground self-end">/year</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">which is {formatPrice(annualFinal / 12, true)}.</p>
                                    {annualSavingAmount > 0 && <p className="text-sm font-semibold text-primary">You save {formatPrice(annualSavingAmount)} per year!</p>}
                                </div>
                           )}
                        </div>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <ul className="space-y-3">
                          {(tier.features || []).slice(0, 5).map((featureKey: string) => {
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
        ) : (
             <div className="text-center py-20 border-2 border-dashed rounded-lg">
                <Info className="mx-auto h-12 w-12 text-muted-foreground" />
                <h2 className="mt-6 text-2xl font-semibold">No Membership Plans Found</h2>
                <p className="mt-2 text-muted-foreground">
                    It looks like no membership plans have been configured for the platform yet.
                </p>
                <Button asChild className="mt-6">
                    <Link href="/adminaccount?view=pricing-memberships">
                        Go to Admin Backend to Create Plans
                    </Link>
                </Button>
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
          {sortedTiers && sortedTiers.length > 0 ? (
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
                                <TableCell colSpan={((sortedTiers?.length) || 0) + 1} className="font-semibold text-primary">{section.name}</TableCell>
                            </TableRow>
                            {section.features.map((feature) => (
                                <TableRow key={feature.key}>
                                    <TableCell className="font-medium pl-8">{feature.name}</TableCell>
                                    {sortedTiers?.map((tier: any) => (
                                        <TableCell key={`${tier.id}-${feature.key}`} className="text-center">
                                            {renderCheckmark((tier.features || []).includes(feature.key))}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
          ) : (
            <p className="text-center text-muted-foreground">Feature comparison will be available once plans are created.</p>
          )}
        </div>
      </section>
    </div>
  );
}
