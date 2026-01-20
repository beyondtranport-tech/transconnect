
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Cpu, DollarSign, Handshake, Shield, ShoppingBasket, Store, ShieldCheck } from 'lucide-react';
import data from '@/lib/placeholder-images.json';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { divisions } from "@/lib/data";

const { placeholderImages } = data;

const heroImage = placeholderImages.find(p => p.id === "hero-home");
const techImage = placeholderImages.find(p => p.id === "tech-home");

const iconComponents: { [key: string]: React.ElementType } = {
    DollarSign,
    ShoppingBasket,
    Store,
    Cpu,
};

export default function Home() {
  return (
    <div className="flex flex-col">
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
            Your Business Should Flow.
          </h1>
           <p className="mt-4 text-lg md:text-xl text-primary-foreground/90 max-w-3xl mx-auto">
            Our platform is tailor-made to be an efficient, community-driven ecosystem. We provide innovative solutions and tools to help you build trust, create opportunity, and foster collaboration. Our members drive our community, and our software is purpose-built to break constraints and create lasting, meaningful change for your business.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/join">Join the Ecosystem</Link>
          </Button>
        </div>
      </section>

      <section id="about" className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-headline">How We Create Flow</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Every transport business faces constraints: cash flow bottlenecks, high costs, and missed opportunities. Logistics Flow is designed to break these constraints, creating a seamless flow of capital, savings, and work to fuel your growth.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-primary"/>
                  Capital Flow
                </CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="font-semibold text-destructive">Constraint: Locked Capital</p>
                  <p className="text-sm text-muted-foreground mt-1">
                      Traditional financing doesn't understand your business, blocking access to vital funds.
                  </p>
                  <p className="font-semibold text-primary mt-3">Flow: Unlocked Funding</p>
                  <p className="text-sm text-muted-foreground mt-1">
                      We connect you with a network of funders, turning your assets and contracts into accessible cash flow.
                  </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Cpu className="h-8 w-8 text-primary"/>
                  Opportunity Flow
                </CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="font-semibold text-destructive">Constraint: Wasted Capacity</p>
                  <p className="text-sm text-muted-foreground mt-1">
                      Empty return trips and inefficient routes drain your profitability every day.
                  </p>
                  <p className="font-semibold text-primary mt-3">Flow: Maximized Efficiency</p>
                  <p className="text-sm text-muted-foreground mt-1">
                      Our AI-powered tools help you find profitable backloads and optimize your routes, turning empty miles into revenue.
                  </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Handshake className="h-8 w-8 text-primary"/>
                  Network Flow
                </CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="font-semibold text-destructive">Constraint: Limited Network</p>
                  <p className="text-sm text-muted-foreground mt-1">
                      Growth is difficult when you're operating in isolation.
                  </p>
                  <p className="font-semibold text-primary mt-3">Flow: Passive Income & Collaboration</p>
                  <p className="text-sm text-muted-foreground mt-1">
                      Activate the 'Actions' plan to earn recurring income by referring members. Collaborate and subcontract with trusted peers.
                  </p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Shield className="h-8 w-8 text-primary"/>
                  Savings Flow
                </CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="font-semibold text-destructive">Constraint: High Costs</p>
                  <p className="text-sm text-muted-foreground mt-1">
                      Individual operators lack the leverage to get significant discounts on essential parts and services.
                  </p>
                  <p className="font-semibold text-primary mt-3">Flow: Collective Buying Power</p>
                  <p className="text-sm text-muted-foreground mt-1">
                      Our community's combined volume allows us to negotiate bulk discounts, passing the savings directly on to you.
                  </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-headline">Explore Our Divisions</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Each division is a specialized hub designed to address key areas of your business, from financing to sales.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {divisions.map((division) => {
              const IconComponent = iconComponents[division.icon];
              const divisionHref = `/${division.id}`;
              return (
                 <Link href={divisionHref} key={division.id} className="block group">
                    <Card className="flex flex-col text-center shadow-lg hover:shadow-primary/20 transition-all h-full group-hover:border-primary">
                    <CardHeader>
                        {IconComponent && <IconComponent className="h-10 w-10 text-primary mx-auto mb-4" />}
                        <CardTitle>{division.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-muted-foreground">{division.description}</p>
                    </CardContent>
                     <CardFooter>
                        <p className="text-sm font-semibold text-primary mx-auto flex items-center gap-2">
                           Explore {division.title} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </p>
                    </CardFooter>
                    </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
                <Card className="bg-card shadow-lg">
                  <CardHeader>
                     <CardTitle className="flex items-center gap-3">
                         <ShieldCheck className="h-8 w-8 text-primary"/>
                         Member Value Guarantee
                     </CardTitle>
                     <CardDescription>
                       Our commitment to creating a fair, transparent, and valuable ecosystem for every member.
                     </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-muted-foreground">
                     <p>We are a community that is built on the foundation of our member contributions. Our technology provides the tools that allow our members to connect and collaborate with each other. This is a powerful combination that, when managed correctly, is able to unlock enormous value that can be shared amongst all our members.</p>
                     <p>Central to our vision is to use digital platforms to drive efficiencies, data to enhance decisioning and collaboration to drive leverage.</p>
                  </CardContent>
                </Card>
            </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-background">
         <div className="container mx-auto px-4">
           <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative aspect-video rounded-lg overflow-hidden shadow-2xl">
              {techImage && (
                <Image
                  src={techImage.imageUrl}
                  alt={techImage.description}
                  fill
                  className="object-cover"
                  data-ai-hint={techImage.imageHint}
                />
              )}
             </div>
             <div>
              <span className="text-primary font-semibold">TECH-POWERED</span>
              <h2 className="text-3xl md:text-4xl font-bold font-headline mt-2">Smarter, Faster, Further</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Our advanced technology suite, featuring an AI-powered freight matching system, helps you eliminate guesswork, reduce empty miles, and maximize your profitability. Find the perfect load in real-time.
              </p>
              <Button asChild size="lg" className="mt-8">
                <Link href="/tech">Explore Our Tech <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
             </div>
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
            <Link href="/join">Create Your Account</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
