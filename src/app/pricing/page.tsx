
'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const tiers = [
  {
    id: 'access',
    name: 'Access',
    price: {
      monthly: 375,
      annual: 3750,
    },
    description: 'Mandatory base plan for platform access.',
    features: [
      { text: 'Access to Community Forum', included: true },
      { text: 'Basic Marketplace Access', included: true },
      { text: 'Weekly Newsletter', included: true },
      { text: 'AI Freight Matching', included: false },
      { text: 'Discounted Mall Access', included: false },
    ],
    mandatory: true,
  },
  {
    id: 'reward',
    name: 'Reward',
    price: {
      monthly: 125,
      annual: 1250,
    },
    description: 'Unlock rewards and advanced matching.',
    features: [
      { text: 'Earn & Redeem Reward Points', included: true },
      { text: 'AI Freight Matching (Unlimited)', included: true },
      { text: 'Priority Load Alerts', included: true },
    ],
    mandatory: false,
  },
  {
    id: 'loyalty',
    name: 'Loyalty',
    price: {
      monthly: 100,
      annual: 1000,
    },
    description: 'Exclusive discounts and loyalty benefits.',
    features: [
      { text: 'Exclusive Mall Discounts', included: true },
      { text: 'Loyalty Tier Status', included: true },
      { text: 'Early access to new features', included: true },
    ],
    mandatory: false,
  },
];

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
};

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlans, setSelectedPlans] = useState<string[]>(['access']);

  const handlePlanChange = (planId: string, checked: boolean | 'indeterminate') => {
    if (checked) {
      setSelectedPlans((prev) => [...prev, planId]);
    } else {
      setSelectedPlans((prev) => prev.filter((id) => id !== planId));
    }
  };

  const total = selectedPlans.reduce((acc, planId) => {
    const tier = tiers.find(t => t.id === planId);
    if (tier) {
      return acc + tier.price[billingCycle];
    }
    return acc;
  }, 0);


  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-headline">Find a Plan to Power Your Business</h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground">
            Start with the mandatory Access plan and add what you need. All prices are VAT exclusive.
          </p>
        </div>

        <div className="flex justify-center items-center gap-4 mb-12">
          <Label htmlFor="billing-cycle" className={billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}>Monthly</Label>
          <Switch 
            id="billing-cycle"
            checked={billingCycle === 'annual'}
            onCheckedChange={(checked) => setBillingCycle(checked ? 'annual' : 'monthly')}
            aria-label="Toggle billing cycle"
          />
          <Label htmlFor="billing-cycle" className={billingCycle === 'annual' ? 'text-foreground' : 'text-muted-foreground'}>
            Annual <span className="text-primary text-xs font-semibold">(Save 2 months)</span>
          </Label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {tiers.map((tier) => (
            <Card 
              key={tier.id} 
              className={cn(
                'flex flex-col h-full shadow-lg transition-all',
                selectedPlans.includes(tier.id) ? 'border-primary shadow-2xl' : ''
              )}
            >
              <CardHeader className="relative">
                <div className='flex items-start justify-between'>
                    <div>
                        <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                        <CardDescription className='mt-2'>{tier.description}</CardDescription>
                    </div>
                     <Checkbox
                        id={tier.id}
                        checked={selectedPlans.includes(tier.id)}
                        disabled={tier.mandatory}
                        onCheckedChange={(checked) => handlePlanChange(tier.id, checked)}
                        className='h-6 w-6'
                        aria-label={`Select ${tier.name} plan`}
                    />
                </div>
                <div className="flex items-baseline gap-1 pt-4">
                  <span className="text-4xl font-extrabold tracking-tight">{formatPrice(tier.price[billingCycle])}</span>
                  <span className="text-muted-foreground">/{billingCycle === 'monthly' ? 'mo' : 'yr'} + VAT</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-4">
                  {tier.features.map((feature) => (
                    <li key={feature.text} className="flex items-center gap-3">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-primary" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className={!feature.included ? 'text-muted-foreground' : ''}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16">
            <Card className='max-w-xl mx-auto'>
                <CardHeader>
                    <CardTitle>Your Custom Plan</CardTitle>
                    <CardDescription>Review your selection and proceed to checkout.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className='space-y-2'>
                        {tiers.filter(t => selectedPlans.includes(t.id)).map(t => (
                            <div key={t.id} className="flex justify-between items-center">
                                <span>{t.name}</span>
                                <span className='font-medium'>{formatPrice(t.price[billingCycle])}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t my-4"></div>
                    <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total (per {billingCycle === 'monthly' ? 'month' : 'year'})</span>
                        <span>{formatPrice(total)} + VAT</span>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button asChild className="w-full" size='lg'>
                        <Link href="/join">Proceed to Checkout</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>

      </div>
    </div>
  );
}
