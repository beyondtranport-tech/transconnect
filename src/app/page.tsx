'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  ArrowRight, 
  Truck, 
  Store, 
  ShoppingBasket,
  Zap, 
  Handshake, 
  TrendingUp,
  Search,
  CheckCircle2,
  ArrowDown,
  PackageSearch,
  Landmark,
  ShoppingCart,
  Users
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import data from "@/lib/placeholder-images.json";
import { useUser } from "@/firebase";
import { useState } from "react";
import * as gtag from '@/lib/gtag';
import { HomeIntentModal } from "@/app/home-intent-modal";
import { Badge } from "@/components/ui/badge";

const { placeholderImages } = data;
const heroImage = placeholderImages.find(p => p.id === 'hero-home');

export default function HomePage() {
  const { user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleJoinClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    if (process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID) {
      gtag.event({ action: 'click_join_from_hero', category: 'Engagement', label: 'Homepage Hero CTA', value: 1 });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="bg-background text-left text-foreground">
      <HomeIntentModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
      
      {/* HERO SECTION - COMMERCE FIRST */}
      <section className="relative w-full h-[90vh] flex items-center justify-center overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 z-0 opacity-40">
           {heroImage && <Image src={heroImage.imageUrl} alt="Industrial Commerce" fill className="object-cover" priority data-ai-hint="truck harbor loading" />}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/70 to-slate-950" />

        <div className="container relative z-10 mx-auto px-4 text-center text-white">
            <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 py-1.5 px-6 text-[10px] font-black uppercase tracking-widest text-center text-white">The Industrial Commerce Engine</Badge>
            <h1 className="text-5xl md:text-8xl font-black font-headline leading-[0.9] mb-8 tracking-tighter text-center text-white uppercase">
                Sell More. <br/>Find Work. <span className="text-primary">Fast.</span>
            </h1>
            <p className="text-lg md:text-2xl text-slate-300 max-w-2xl mx-auto mb-12 leading-relaxed text-center text-white font-medium">
                Logistics Flow is where the South African logistics sector trades. <br/>
                We connect your digital shop, your fleet, and your capacity to a verified community of verified high-intent buyers.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6 text-white text-center">
                <Button size="lg" className="h-16 px-12 text-lg font-black uppercase tracking-widest shadow-2xl bg-primary hover:bg-primary/90 text-white border-b-4 border-green-800 active:border-b-0 transition-all text-center" onClick={handleJoinClick}>
                    Open Your digital Branch <ArrowRight className="ml-2 h-6 w-6 text-white" />
                </Button>
                <Button asChild size="lg" variant="outline" className="h-16 px-12 text-lg font-black uppercase tracking-tight border-white/20 hover:bg-white/10 text-white text-center">
                    <Link href="/mall">Browse the Malls</Link>
                </Button>
            </div>
            <div className="mt-16 animate-bounce opacity-30 text-center">
                <ArrowDown className="mx-auto h-8 w-8 text-white" />
            </div>
        </div>
      </section>

      {/* CORE MECHANISM - THE TRANSACTIONAL VALUE */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 text-left text-foreground">
            <div className="max-w-5xl mx-auto space-y-12 text-left">
                <div className="space-y-4 text-left">
                    <h2 className="text-4xl md:text-6xl font-black font-headline text-slate-900 tracking-tight uppercase text-left">Collective Buying Power.</h2>
                    <p className="text-xl text-muted-foreground leading-relaxed text-left">
                        We've built the digital infrastructure to remove the friction from industrial sales and procurement. Explore the commercial mechanisms powering the grid.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                    {/* DIGITAL SHOPS */}
                    <Card className="p-6 border-none shadow-xl bg-slate-50 text-left flex flex-col h-full overflow-hidden hover:-translate-y-2 transition-transform">
                        <Store className="h-10 w-10 text-primary mb-4" />
                        <h3 className="text-xl font-black uppercase mb-2">Digital Shops</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-8 flex-grow">
                          Establish a branch in front of 5,400+ hauliers actively maintaining fleets.
                        </p>
                        <Button asChild variant="link" className="p-0 h-auto font-black uppercase text-[10px] tracking-widest text-primary justify-start group">
                            <Link href="/commerce#shops">Explore Mechanism <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" /></Link>
                        </Button>
                    </Card>

                    {/* LOAD BOARD */}
                    <Card className="p-6 border-none shadow-xl bg-slate-50 text-left flex flex-col h-full overflow-hidden hover:-translate-y-2 transition-transform">
                        <PackageSearch className="h-10 w-10 text-primary mb-4" />
                        <h3 className="text-xl font-black uppercase mb-2">The Load Board</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-8 flex-grow">
                          Eliminate empty return miles. Post freight or find loads in real-time.
                        </p>
                        <Button asChild variant="link" className="p-0 h-auto font-black uppercase text-[10px] tracking-widest text-primary justify-start group">
                            <Link href="/commerce#loads">Explore Mechanism <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" /></Link>
                        </Button>
                    </Card>

                    {/* BUY & SELL BOARD */}
                    <Card className="p-6 border-none shadow-xl bg-slate-50 text-left flex flex-col h-full overflow-hidden hover:-translate-y-2 transition-transform">
                        <ShoppingCart className="h-10 w-10 text-primary mb-4" />
                        <h3 className="text-xl font-black uppercase mb-2">Buy & Sell Board</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-8 flex-grow">
                          Trade trucks and equipment within a high-trust, verified peer-to-peer marketplace.
                        </p>
                        <Button asChild variant="link" className="p-0 h-auto font-black uppercase text-[10px] tracking-widest text-primary justify-start group">
                            <Link href="/commerce#marketplace">Explore Mechanism <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" /></Link>
                        </Button>
                    </Card>

                    {/* CUSTOMERS BOARD */}
                    <Card className="p-6 border-none shadow-xl bg-slate-50 text-left flex flex-col h-full overflow-hidden hover:-translate-y-2 transition-transform">
                        <Users className="h-10 w-10 text-primary mb-4" />
                        <h3 className="text-xl font-black uppercase mb-2">Customers Board</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-8 flex-grow">
                          Access direct MD/CEO lines and lead signals for 22,000+ industry stakeholders.
                        </p>
                        <Button asChild variant="link" className="p-0 h-auto font-black uppercase text-[10px] tracking-widest text-primary justify-start group">
                            <Link href="/resources">Explore Intelligence <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" /></Link>
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
      </section>

      {/* INTELLIGENCE AS A BOOSTER */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8 text-left text-white">
                    <Badge className="bg-primary/20 text-primary border-none py-1 px-4 font-black uppercase tracking-widest text-[10px]">Commerce Enhanced</Badge>
                    <h2 className="text-4xl md:text-6xl font-black font-headline text-white leading-[0.95] uppercase text-left">Trading <br/>with <span className="text-primary">Eyes Open</span>.</h2>
                    <p className="text-xl text-slate-400 leading-relaxed text-left text-white">
                        Intelligence isn't our product—it's how we make you more successful. By mapping the grid, we give you the data to sell faster and fund your growth.
                    </p>
                    <div className="space-y-6 text-left text-white">
                        <div className="flex items-start gap-4 text-left">
                            <div className="bg-primary/20 p-2 rounded-lg text-primary"><Search className="h-6 w-6" /></div>
                            <div className="text-left text-white">
                                <p className="font-bold text-white uppercase text-sm">Lead Discovery</p>
                                <p className="text-slate-400 text-sm">Identify exactly who is buying and who owns the budget.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 text-left">
                            <div className="bg-primary/20 p-2 rounded-lg text-primary"><Zap className="h-6 w-6 fill-current" /></div>
                            <div className="text-left text-white">
                                <p className="font-bold text-white uppercase text-sm">AI Matching</p>
                                <p className="text-slate-400 text-sm">Our engine proactively connects your stock with the right truck.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 text-left">
                            <div className="bg-primary/20 p-2 rounded-lg text-primary"><Landmark className="h-6 w-6" /></div>
                            <div className="text-left text-white">
                                <p className="font-bold text-white uppercase text-sm">Verified Capital</p>
                                <p className="text-slate-400 text-sm">Use your platform activity to unlock in-house asset finance.</p>
                            </div>
                        </div>
                    </div>
                    <div className="pt-8 text-left">
                        <Button asChild size="lg" className="h-14 px-10 font-black uppercase tracking-widest gap-2 bg-primary hover:bg-primary/90 text-white border-none shadow-xl text-center">
                            <Link href="/mall">
                                <Search className="h-5 w-5 text-white" /> Access Intelligence Layer
                            </Link>
                        </Button>
                    </div>
                </div>
                <div className="relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl border-8 border-slate-800">
                    <Image 
                        src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1000" 
                        alt="Logistics Flow Data" 
                        fill 
                        className="object-cover opacity-80" 
                        data-ai-hint="digital industrial map"
                    />
                </div>
            </div>
        </div>
      </section>

      {/* REWARDS & LOYALTY - THE REVEAL */}
      <section className="py-24 bg-white">
          <div className="container mx-auto px-4 text-center">
                <h2 className="text-4xl md:text-6xl font-black font-headline text-slate-900 tracking-tight uppercase mb-4 text-center">Rewarding Every Handshake.</h2>
                <p className="text-lg text-muted-foreground mb-16 max-w-2xl mx-auto text-center">As you transact, you earn. Our loyalty and rewards programs are baked into the core commerce workflow.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto text-left">
                    <Card className="p-8 border-2 border-slate-100 shadow-sm text-left">
                        <TrendingUp className="h-10 w-10 text-primary mb-4" />
                        <h4 className="font-black uppercase mb-2">Dividends</h4>
                        <p className="text-sm text-muted-foreground">A share of platform success returned to the most active nodes.</p>
                    </Card>
                    <Card className="p-8 border-2 border-slate-100 shadow-sm text-left">
                        <Badge className="bg-green-100 text-green-700 mb-4">Loyalty</Badge>
                        <h4 className="font-black uppercase mb-2">Syndicate Rates</h4>
                        <p className="text-sm text-muted-foreground">Unlock deeper discounts on tires and fuel as your transaction volume grows.</p>
                    </Card>
                    <Card className="p-8 border-2 border-slate-100 shadow-sm text-left">
                        <Badge variant="outline" className="border-primary text-primary mb-4">Integrity</Badge>
                        <h4 className="font-black uppercase mb-2">Node Equity</h4>
                        <p className="text-sm text-muted-foreground">Every referral and verified data contribution builds your platform standing.</p>
                    </Card>
                </div>
          </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 bg-slate-50 border-t">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-4xl md:text-7xl font-black font-headline text-slate-900 tracking-tighter text-center uppercase leading-none mb-8">Ready to <br/>Transact?</h2>
                <p className="text-xl max-w-xl mx-auto text-muted-foreground leading-relaxed mb-12 text-center">Sign up for free and establish your digital branch in the South African logistics grid.</p>
                <div className="flex justify-center text-center">
                     <Button size="lg" className="h-16 px-16 text-lg font-black uppercase shadow-2xl text-white bg-primary hover:bg-primary/90 text-center" onClick={handleJoinClick}>
                        Establish Handshake <ArrowRight className="ml-2 h-6 w-6 text-white text-center" />
                    </Button>
                </div>
            </div>
        </section>
    </div>
  );
}
