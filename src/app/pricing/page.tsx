
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star, Minus } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const tiers = [
  {
    id: 'basic',
    name: 'Basic',
    price: { monthly: 375, annual: 375 * 12 * 0.85 },
    description: 'Essential tools for owner-operators and small fleets getting started.',
    features: [
      'Access to All Malls',
      'Marketplace Access',
      'AI Freight Matcher (Basic)',
      'Community Forum Access',
      'Standard Support',
    ],
    isPopular: false,
  },
  {
    id: 'standard',
    name: 'Standard',
    price: { monthly: 425, annual: 425 * 12 * 0.85 },
    description: 'Advanced features for growing businesses looking to optimize.',
    features: [
      'All Basic features',
      'AI Freight Matcher (Advanced)',
      'Real-time Analytics Dashboard',
      'Loyalty & Rewards Program Access',
      'Priority Support',
    ],
    isPopular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: { monthly: 475, annual: 475 * 12 * 0.85 },
    description: 'Comprehensive solutions for established fleets and power users.',
    features: [
      'All Standard features',
      'Dedicated Account Manager',
      'API Access for Integrations',
      'Actions Plan Included',
      '24/7 Premium Support',
    ],
    isPopular: false,
  },
];

const featureSections = [
    {
        name: 'Core Platform',
        features: [
            { name: 'Community Forum Access', basic: true, standard: true, premium: true },
            { name: 'Standard Support', basic: true, standard: true, premium: true },
        ]
    },
    {
        name: 'Mall Division',
        features: [
             { name: 'Supplier Mall Access', basic: true, standard: true, premium: true },
             { name: 'Transporter Mall Access', basic: true, standard: true, premium: true },
             { name: 'Finance Mall Access', basic: true, standard: true, premium: true },
             { name: 'Buy & Sell Mall', basic: true, standard: true, premium: true },
             { name: 'Warehouse Mall', basic: false, standard: true, premium: true },
             { name: 'Repurpose Mall', basic: false, standard: true, premium: true },
             { name: 'Aftermarket Mall', basic: false, standard: true, premium: true },
        ]
    },
     {
        name: 'Marketplace Division',
        features: [
             { name: 'Access Partner Reseller Network', basic: true, standard: true, premium: true },
        ]
    },
    {
        name: 'Tech Division',
        features: [
            { name: 'AI Freight Matcher (Loads Mall)', basic: 'Basic', standard: 'Advanced', premium: 'Advanced' },
            { name: 'Real-time Analytics Dashboard', basic: false, standard: true, premium: true },
            { name: 'API Access for Integrations', basic: false, standard: false, premium: true },
        ]
    },
    {
        name: 'Connect Plans',
        features: [
            { name: 'Loyalty Plan Access', basic: false, standard: true, premium: true },
            { name: 'Rewards Plan Access', basic: false, standard: true, premium: true },
            { name: 'Actions Plan Included', basic: false, standard: false, premium: true },
        ]
    },
    {
        name: 'Service & Support',
        features: [
            { name: 'Priority Support', basic: false, standard: true, premium: true },
            { name: 'Dedicated Account Manager', basic: false, standard: false, premium: true },
            { name: '24/7 Premium Support', basic: false, standard: false, premium: true },
        ]
    },
];


const formatPrice = (price: number, perMonth = false) => {
    const formatted = new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
    return perMonth ? `${formatted}/month` : formatted;
};

const renderCheckmark = (value: boolean | string) => {
    if (typeof value === 'string') {
        return <span className="font-semibold text-sm">{value}</span>;
    }
    if (value) {
        return <Check className="h-5 w-5 text-green-500 mx-auto" />;
    }
    return <Minus className="h-5 w-5 text-muted-foreground mx-auto" />;
};

export default function MembershipPage() {
  const { user } = useUser();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-headline">Choose Your Plan</h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground">
            Select the perfect plan to fuel your business growth. All plans come with a 30-day money-back guarantee.
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
                Annual <span className="text-primary font-semibold ml-1">(Save 15%)</span>
            </Label>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {tiers.map((tier) => (
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
                <CardDescription className="mt-2 text-base h-10">{tier.description}</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-extrabold tracking-tight">
                    {formatPrice(billingCycle === 'annual' ? tier.price.annual / 12 : tier.price.monthly)}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                  {billingCycle === 'annual' && (
                     <p className="text-xs text-muted-foreground mt-1">Billed as {formatPrice(tier.price.annual)} per year</p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="p-6">
                <Button asChild className="w-full" size="lg" variant={tier.isPopular ? 'default' : 'outline'}>
                  <Link href={`/checkout/${tier.id}?cycle=${billingCycle}`}>
                    Choose {tier.name}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-headline">Compare Features</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Find the right set of tools for your business needs.
            </p>
          </div>
          <div className="max-w-5xl mx-auto border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-2/5 font-bold text-lg">Features</TableHead>
                  {tiers.map(tier => (
                    <TableHead key={tier.id} className="text-center font-bold text-lg">{tier.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {featureSections.map((section) => (
                    <React.Fragment key={section.name}>
                        <TableRow className="bg-muted/50">
                            <TableCell colSpan={4} className="font-semibold text-primary">{section.name}</TableCell>
                        </TableRow>
                        {section.features.map((feature) => (
                            <TableRow key={feature.name}>
                                <TableCell className="font-medium pl-8">{feature.name}</TableCell>
                                <TableCell className="text-center">{renderCheckmark(feature.basic)}</TableCell>
                                <TableCell className="text-center">{renderCheckmark(feature.standard)}</TableCell>
                                <TableCell className="text-center">{renderCheckmark(feature.premium)}</TableCell>
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
