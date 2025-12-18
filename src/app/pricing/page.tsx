
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

const tiers = [
  {
    name: 'Member',
    price: 'R0',
    frequency: '/month',
    description: 'For individuals getting started in the transport industry.',
    features: [
      { text: 'Access to Community Forum', included: true },
      { text: 'Basic Marketplace Access', included: true },
      { text: 'Weekly Newsletter', included: true },
      { text: 'AI Freight Matching (5 searches/mo)', included: false },
      { text: 'Discounted Mall Access', included: false },
      { text: 'Priority Support', included: false },
      { text: 'Advanced Analytics', included: false },
    ],
    cta: 'Sign Up for Free',
    href: '/join',
  },
  {
    name: 'Professional',
    price: 'R750',
    frequency: '/month',
    description: 'For owner-operators and small fleets ready to grow.',
    features: [
      { text: 'Access to Community Forum', included: true },
      { text: 'Full Marketplace Access & Listings', included: true },
      { text: 'Weekly Newsletter', included: true },
      { text: 'AI Freight Matching (Unlimited)', included: true },
      { text: 'Discounted Mall Access', included: true },
      { text: 'Priority Support', included: false },
      { text: 'Advanced Analytics', included: false },
    ],
    cta: 'Get Started',
    href: '/join',
    recommended: true,
  },
  {
    name: 'Enterprise',
    price: 'Contact Us',
    frequency: '',
    description: 'For large fleets requiring advanced tools and support.',
    features: [
      { text: 'Access to Community Forum', included: true },
      { text: 'Full Marketplace Access & Listings', included: true },
      { text: 'Weekly Newsletter', included: true },
      { text: 'AI Freight Matching (Unlimited)', included: true },
      { text: 'Discounted Mall Access', included: true },
      { text: 'Priority Support', included: true },
      { text: 'Advanced Analytics & Reporting', included: true },
    ],
    cta: 'Contact Sales',
    href: '/contact',
  },
];

export default function PricingPage() {
  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-headline">Find a Plan to Power Your Business</h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground">
            Simple, transparent pricing. Choose the plan that's right for you and unlock the full potential of the TransConnect ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {tiers.map((tier) => (
            <Card key={tier.name} className={`flex flex-col h-full ${tier.recommended ? 'border-primary shadow-2xl' : 'shadow-lg'}`}>
              <CardHeader className="relative">
                {tier.recommended && (
                  <div className="absolute top-0 -translate-y-1/2 w-full flex justify-center">
                    <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  </div>
                )}
                <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight">{tier.price}</span>
                  {tier.frequency && <span className="text-muted-foreground">{tier.frequency}</span>}
                </div>
                <CardDescription>{tier.description}</CardDescription>
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
              <CardFooter>
                <Button asChild className="w-full" variant={tier.recommended ? 'default' : 'outline'}>
                  <Link href={tier.href}>{tier.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
