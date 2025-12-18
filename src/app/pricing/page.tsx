
'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const tiers = [
  {
    id: 'basic',
    name: 'Basic',
    price: {
      monthly: 150,
      annual: 150 * 12 * 0.85, // 15% discount
    },
    description: '',
    features: [],
    highlight: false,
  },
  {
    id: 'standard',
    name: 'Standard',
    price: {
      monthly: 450,
      annual: 450 * 12 * 0.85, // 15% discount
    },
    description: '',
    features: [],
    highlight: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: {
      monthly: 900,
      annual: 900 * 12 * 0.85, // 15% discount
    },
    description: '',
    features: [],
    highlight: false,
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

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-headline">Find a Plan to Power Your Business</h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground">
            Choose the plan that's right for you. All prices are VAT exclusive.
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
            Annual <span className="text-primary text-xs font-semibold">(15% discount)</span>
          </Label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-5xl mx-auto">
          {tiers.map((tier) => (
            <Card 
              key={tier.id} 
              className={cn(
                'flex flex-col h-full shadow-lg transition-all',
                tier.highlight ? 'border-primary shadow-2xl relative' : 'border-border'
              )}
            >
              {tier.highlight && (
                <div className="absolute -top-4 right-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                <CardDescription className='mt-2 h-10'>{tier.description}</CardDescription>
                <div className="flex items-baseline gap-1 pt-4">
                  <span className="text-4xl font-extrabold tracking-tight">{formatPrice(tier.price[billingCycle])}</span>
                  <span className="text-muted-foreground">/{billingCycle === 'monthly' ? 'mo' : 'yr'} + VAT</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow min-h-[150px]">
                <ul className="space-y-4">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-primary" />
                        <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                 <Button asChild className="w-full" variant={tier.highlight ? 'default' : 'outline'}>
                    <Link href="/join">Choose {tier.name}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
