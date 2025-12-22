
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { useUser } from '@/firebase';

const features = {
    malls: [
        "Supplier", "Transport", "Funding", "Loads", "Buy and Sell", 
        "Developer", "Warehousing", "Distribution", "Repurpose"
    ],
    marketplace: [
        "Data", "Agents", "Accountants", "Mobile", "Marketing", "Courier", 
        "Pay per click", "SEO", "Branding", "Copywriting", "Communication", 
        "Mahala hub", "RAF assist", "Open loyalty funeral", 
        "Open loyalty roadside assist", "Open loyalty benefit"
    ],
    tech: [
        "# days free onboarding support", "# hrs free tech support for 1st month", 
        "# hrs free SEO optimization 1st month", "# email templates", 
        "# emails per month", "# group emails per month", "Facebook login", 
        "Google login", "# API calls per month", "# Products in mall", 
        "# Methods per month", "# themes available", "# templates available", 
        "# website meta key words", "# staff", "# product reviews per month"
    ]
};

const tiers = [
  {
    id: 'basic',
    name: 'Basic',
    price: {
      monthly: 375,
      annual: 375 * 12 * 0.85,
    },
    description: '',
    features: {
        malls: ["Supplier", "Transport", "Funding"],
        marketplace: [
            "Data", "Agents", "Mahala hub", "RAF assist", "Open loyalty funeral", 
            "Open loyalty roadside assist", "Open loyalty benefit"
        ],
        tech: [
            "# email templates", 
            "# emails per month", "# group emails per month", "Facebook login", 
            "Google login",
        ]
    },
    highlight: false,
  },
  {
    id: 'standard',
    name: 'Standard',
    price: {
      monthly: 425,
      annual: 425 * 12 * 0.85,
    },
    description: '',
    features: {
        malls: ["Supplier", "Transport", "Funding", "Loads", "Buy and Sell", "Distribution", "Repurpose"],
        marketplace: [
            "Data", "Agents", "Accountants", "Mobile", "Marketing", "Courier", 
            "Pay per click", "Mahala hub", "RAF assist", "Open loyalty funeral", 
            "Open loyalty roadside assist", "Open loyalty benefit"
        ],
        tech: [
            "# email templates", 
            "# emails per month", "# group emails per month", "Facebook login", 
            "Google login", "# API calls per month", "# Products in mall", 
            "# Methods per month", "# themes available", "# templates available", 
            "# website meta key words", "# staff", "# product reviews per month"
        ]
    },
    highlight: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: {
      monthly: 475,
      annual: 475 * 12 * 0.85,
    },
    description: '',
    features: {
        malls: [...features.malls],
        marketplace: [...features.marketplace],
        tech: [...features.tech]
    },
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

const FeatureList = ({ title, items, includedFeatures }: { title: string, items: string[], includedFeatures: string[] }) => (
    <div className="mt-6">
        <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{title}</h4>
        <ul className="mt-3 space-y-3">
            {items.map((item) => (
                <li key={item} className="flex items-center justify-between text-sm">
                    <span>{item}</span>
                    <Checkbox checked={includedFeatures.includes(item)} disabled />
                </li>
            ))}
        </ul>
    </div>
);


export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const { user } = useUser();
  
  const getLinkHref = (tierId: string) => {
    if (!user) {
      return `/join?plan=${tierId}`;
    }
    return `/checkout/${tierId}?cycle=${billingCycle}`;
  };

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
            Annual <span className="text-primary text-xs font-semibold">(15% discount if annual membership is selected)</span>
          </Label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-7xl mx-auto">
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
                 <FeatureList title="Malls" items={features.malls} includedFeatures={tier.features.malls} />
                 <FeatureList title="Marketplace" items={features.marketplace} includedFeatures={tier.features.marketplace} />
                 <FeatureList title="Tech" items={features.tech} includedFeatures={tier.features.tech} />
              </CardContent>
              <CardFooter>
                 <Button asChild className="w-full" variant={tier.highlight ? 'default' : 'outline'}>
                    <Link href={getLinkHref(tier.id)}>Choose {tier.name}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
