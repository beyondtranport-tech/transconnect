
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Cpu, DollarSign, Heart, Shield, CheckCircle, Info, Handshake } from 'lucide-react';
import data from '@/lib/placeholder-images.json';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const { placeholderImages } = data;

const heroImage = placeholderImages.find(p => p.id === "hero-home");
const techImage = placeholderImages.find(p => p.id === "tech-home");

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

      <section id="about" className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-headline">About Us</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Running a transport company is challenging. Having financed transporters for the past 30 years, we understand your challenges. Most importantly we understand how difficult it is to access the capital you need to grow your business. This is why we have developed a unique approach to unlock your business.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Heart className="h-8 w-8 text-primary"/>
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-muted-foreground">
                  <p>Our mission is to Reward Borrowers to engage with our ecosystem by:</p>
                  <ul className="list-disc list-inside space-y-2 pl-2">
                    <li>Empowering borrowers to obtain funding from Simplyfi Flow and our Funding partners.</li>
                    <li>Developing our own data source which will reduce lender risk.</li>
                    <li>Streamlining interactions to remove anxiety and create value for all role-players.</li>
                  </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Shield className="h-8 w-8 text-primary"/>
                  Our Vision
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-muted-foreground">
                 <p>Our vision is to simplify credit by collaborating, rewarding, and working with clients and partners. We want to build a better future for our customers and decrease their credit risk.</p>
                 <p>Central to our vision is to use digital platforms to drive efficiencies, data to enhance decisioning and collaboration to drive leverage.</p>
              </CardContent>
            </Card>
          </div>
          <Card className="max-w-5xl mx-auto mt-8 bg-card">
             <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <Handshake className="h-8 w-8 text-primary"/>
                    Our Member Value Guarantee
                </CardTitle>
             </CardHeader>
             <CardContent>
                <p className="text-muted-foreground">
                    Our Member Value guarantee is valid for 12 months from date of signing on as a member. We will refund you, the Member, the difference between (Total membership fee + Subscription fee) - (Incentive + Cash back Rewards).
                </p>
             </CardContent>
          </Card>
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
