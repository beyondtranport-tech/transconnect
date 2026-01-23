
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBasket, Store, DollarSign, ShieldCheck, Lock, DatabaseZap } from 'lucide-react';
import data from '@/lib/placeholder-images.json';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HomeIntentModal } from './home-intent-modal';
import { useState } from 'react';

const { placeholderImages } = data;

const newHeroImage = placeholderImages.find(p => p.id === "value-integrity");

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col">
      <HomeIntentModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
      
      {/* New Hero Section */}
      <section className="relative w-full h-[60vh] md:h-[70vh] flex items-center justify-center text-center">
        {newHeroImage && (
          <Image
            src={newHeroImage.imageUrl}
            alt={newHeroImage.description}
            fill
            className="object-cover"
            priority
            data-ai-hint={newHeroImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground font-headline tracking-tight">
            Build Your Network, Grow Your Business
          </h1>
           <p className="mt-4 text-lg md:text-xl text-primary-foreground/90 max-w-3xl mx-auto">
            Join a community of Logistics professionals. Contribute your knowledge, unlock collective savings, and create new revenue streams.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/join">Register for Free</Link>
          </Button>
        </div>
      </section>

      {/* Your Own Online Shop Section */}
       <section className="py-16 md:py-24 bg-card">
          <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-4xl font-bold font-headline">Your Own Online Shop for the Logistics Sector</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                Launch a professional storefront to market your services, sell your products, and build a trusted profile to unlock funding. Get started for free.
              </p>
              <Button size="lg" className="mt-8" onClick={() => setIsModalOpen(true)}>
                Create Your Shop
              </Button>
          </div>
      </section>

      <section id="how-it-works" className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-bold font-headline">A Powerful, Simple Path to Growth</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                    In three simple steps, you can establish your digital presence, open new sales channels, and access the capital you need to expand.
                </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 text-center max-w-6xl mx-auto">
                <Card>
                    <CardHeader>
                        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-2">
                           <Store className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle>1. Build Your Digital Branch</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Create a free, basic online shop in minutes. Showcase your business, list your core services, and establish your professional presence in the logistics ecosystem.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-2">
                           <ShoppingBasket className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle>2. Sell Your Goods & Services</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Upgrade to a paid plan to list unlimited products. Whether selling parts, warehouse space, or freight capacity, your shop is your direct sales channel.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-2">
                           <DollarSign className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle>3. Unlock Funding</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Your shop activity and business profile build a trusted operational record. This data-driven approach strengthens your case for accessing our network of funders.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-bold font-headline">Your Security &amp; Data Protection: Our Priority</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                    We understand that your business data is sensitive. We are committed to protecting your privacy and securing your information with robust, industry-standard practices.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <Card className="bg-card text-center">
                    <CardContent className="p-6">
                        <Lock className="h-10 w-10 text-primary mx-auto mb-4" />
                        <h3 className="text-xl font-semibold">Data Privacy</h3>
                        <p className="mt-2 text-muted-foreground">Your personal and company data is never shared or sold. It is only used to power the services you choose to use within the platform.</p>
                    </CardContent>
                </Card>
                <Card className="bg-card text-center">
                    <CardContent className="p-6">
                        <DatabaseZap className="h-10 w-10 text-primary mx-auto mb-4" />
                        <h3 className="text-xl font-semibold">Anonymous Contributions</h3>
                        <p className="mt-2 text-muted-foreground">Data you contribute to the community, like fleet details, is always anonymized and aggregated. It is only used to negotiate group discounts and will never be linked back to you.</p>
                    </CardContent>
                </Card>
                <Card className="bg-card text-center">
                    <CardContent className="p-6">
                        <ShieldCheck className="h-10 w-10 text-primary mx-auto mb-4" />
                        <h3 className="text-xl font-semibold">Secure Platform</h3>
                        <p className="mt-2 text-muted-foreground">Our platform is built on secure, modern infrastructure to protect against unauthorized access and ensure your data remains safe.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-headline">Ready to Join?</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Become a member today and gain access to a world of opportunities. Benefit from our rewards program, community support, and a full suite of tools to supercharge your business.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/join">Create Your Free Account</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
