
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Cpu, DollarSign, Handshake, Shield, ShoppingBasket, Store, ShieldCheck, Lock, DatabaseZap } from 'lucide-react';
import data from '@/lib/placeholder-images.json';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { HomeIntentModal } from './home-intent-modal';
import { useState } from 'react';

const { placeholderImages } = data;

const heroImage = placeholderImages.find(p => p.id === "hero-home");

const iconComponents: { [key: string]: React.ElementType } = {
    DollarSign,
    ShoppingBasket,
    Store,
    Cpu,
};

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col">
      <HomeIntentModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
      <section className="relative w-full h-[60vh] md:h-[70vh] flex items-center justify-center text-center">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover"
            priority
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground font-headline tracking-tight">
            Feeling the Squeeze of High Costs & Wasted Miles?
          </h1>
           <p className="mt-4 text-lg md:text-xl text-primary-foreground/90 max-w-3xl mx-auto">
            The transport industry is tough—fuel costs are rising, finding profitable backloads is a constant battle, and getting fair prices on parts and services feels impossible. Logistics Flow is the answer. Become a member to tap into our community's collective buying power, unlocking exclusive rewards and deals that directly reduce your operational costs and boost your bottom line.
          </p>
          <Button size="lg" className="mt-8" onClick={() => setIsModalOpen(true)}>
            Get Started
          </Button>
        </div>
      </section>

      <section id="about" className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-headline">Member value proposition</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                We're a community-driven ecosystem, not just another software company. Our members drive our community, and our software is purpose-built to break constraints and create lasting, meaningful change for your business. We believe in our model so much that we offer it to you for free for the first year.
              </p>
            </div>
             <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Cpu className="h-8 w-8 text-primary"/>
                  TECH-POWERED
                </CardTitle>
                 <CardDescription>Smarter, Faster, Further</CardDescription>
              </CardHeader>
              <CardContent>
                  <p className="text-sm text-muted-foreground mt-1">
                      Our advanced technology suite, featuring an AI-powered freight matching system, helps you eliminate guesswork, reduce empty miles, and maximize your profitability. Find the perfect load in real-time.
                  </p>
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
