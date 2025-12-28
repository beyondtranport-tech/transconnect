
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Cpu, DollarSign, ShoppingBasket, Store } from 'lucide-react';
import data from '@/lib/placeholder-images.json';
import * as React from 'react';
import { divisions as divisionData } from '@/lib/data';

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
            The Future of Transport is Connected
          </h1>
          <p className="mt-4 text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            Join the TransConnect ecosystem to unlock funding, a dedicated marketplace, and powerful tech to drive your business forward.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/join">Join the Ecosystem</Link>
          </Button>
        </div>
      </section>

      <section id="divisions" className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-headline">Our Divisions</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              A complete ecosystem designed to support every aspect of your transport business.
            </p>
          </div>
          <div className="space-y-16">
             {divisionData.map((division, index) => {
                const IconComponent = iconComponents[division.icon];
                const href = ['marketplace', 'tech', 'funding', 'mall'].includes(division.id) ? `/${division.id}` : `/divisions#${division.id}`;
                return (
                    <div key={division.id} className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                        <div className={`relative aspect-video rounded-lg overflow-hidden shadow-lg ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                             {division.image && (
                                <Image
                                    src={division.image.imageUrl}
                                    alt={division.image.description}
                                    fill
                                    className="object-cover"
                                    data-ai-hint={division.image.imageHint}
                                />
                             )}
                        </div>
                        <div className={index % 2 === 1 ? 'md:order-1' : ''}>
                           <div className="flex items-center gap-4">
                                {IconComponent && <IconComponent className="h-10 w-10 text-primary" />}
                                <h3 className="text-3xl font-bold font-headline">{division.title.split(' ')[1]}</h3>
                            </div>
                            <p className="mt-4 text-lg text-muted-foreground">
                                {division.description}
                            </p>
                            <Button asChild className="mt-6">
                                <Link href={href}>
                                    Learn More <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                )
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-card">
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

      <section className="py-16 md:py-24 bg-background">
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
