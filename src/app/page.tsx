'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  ArrowRight, 
  Truck, 
  Landmark, 
  Building2, 
  Zap, 
  Fingerprint, 
  ShieldCheck, 
  Users, 
  TrendingUp,
  Lock,
  Search,
  AlertTriangle,
  ArrowDown,
  CheckCircle2
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
      
      {/* HERO SECTION - THE PAIN HOOK */}
      <section className="relative w-full h-[90vh] flex items-center justify-center overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 z-0 opacity-30">
           {heroImage && <Image src={heroImage.imageUrl} alt="Industrial Background" fill className="object-cover" priority data-ai-hint="truck highway night" />}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-950/80 to-slate-950" />

        <div className="container relative z-10 mx-auto px-4 text-center">
            <h1 className="text-5xl md:text-8xl font-black font-headline leading-[0.9] mb-8 tracking-tighter text-center text-white uppercase italic">
                Stop Operating <br/>In The <span className="text-primary">Dark</span>.
            </h1>
            <p className="text-lg md:text-2xl text-slate-300 max-w-2xl mx-auto mb-12 leading-relaxed text-center text-white font-medium">
                The South African transport industry is built on "Who you know." <br/>
                We've mapped the entire 22,000+ member registry so you can stop guessing and start growing.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Button size="lg" className="h-16 px-12 text-lg font-black uppercase tracking-widest shadow-2xl bg-primary hover:bg-primary/90 text-white border-b-4 border-green-800 active:border-b-0 transition-all" onClick={handleJoinClick}>
                    Establish Handshake <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
                <Button asChild size="lg" variant="outline" className="h-16 px-12 text-lg font-black uppercase tracking-tight border-white/20 hover:bg-white/10 text-white">
                    <Link href="#the-pain">Why visibility matters</Link>
                </Button>
            </div>
            <div className="mt-16 animate-bounce opacity-30">
                <ArrowDown className="mx-auto h-8 w-8" />
            </div>
        </div>
      </section>

      {/* THE PAIN POINTS - IDENTIFYING WITH THE USER */}
      <section id="the-pain" className="py-24 bg-white">
        <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
                <h2 className="text-4xl md:text-6xl font-black font-headline text-slate-900 tracking-tight text-center uppercase">The Industry is Broken.</h2>
                <p className="text-xl text-muted-foreground leading-relaxed text-center">
                    If you aren't visible to the right people, you're paying a "Silence Tax" every day.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
                <div className="space-y-6 text-left">
                    <div className="bg-red-50 p-4 rounded-2xl w-fit"><AlertTriangle className="h-10 w-10 text-red-600" /></div>
                    <h3 className="text-2xl font-black uppercase text-slate-900">Empty Miles</h3>
                    <p className="text-muted-foreground leading-relaxed">
                        Dropping a load in Durban but coming back empty to Jo'burg? That's profit bleeding out of your tank because the right broker couldn't find your truck in the dark.
                    </p>
                </div>
                <div className="space-y-6 text-left">
                    <div className="bg-red-50 p-4 rounded-2xl w-fit"><Lock className="h-10 w-10 text-red-600" /></div>
                    <h3 className="text-2xl font-black uppercase text-slate-900">Locked Capital</h3>
                    <p className="text-muted-foreground leading-relaxed">
                        Traditional banks don't understand the logistics grid. They see a balance sheet; we see your operational pulse. Without visibility, you stay under-funded.
                    </p>
                </div>
                <div className="space-y-6 text-left">
                    <div className="bg-red-50 p-4 rounded-2xl w-fit"><Users className="h-10 w-10 text-red-600" /></div>
                    <h3 className="text-2xl font-black uppercase text-slate-900">The Gatekeepers</h3>
                    <p className="text-muted-foreground leading-relaxed">
                        Spending hours trying to find the MD or Owner of a supplier? We bypass the switchboard and give you the direct line to decision-makers.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* THE PROMISE - WHAT WE DO */}
      <section className="py-24 bg-slate-50 border-y">
        <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white">
                    <Image 
                        src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1000" 
                        alt="Logistics Efficiency" 
                        fill 
                        className="object-cover" 
                        data-ai-hint="modern warehouse"
                    />
                </div>
                <div className="space-y-8 text-left">
                    <Badge className="bg-primary/10 text-primary border-none py-1 px-4 font-black uppercase tracking-widest text-[10px]">The Solution</Badge>
                    <h2 className="text-4xl md:text-6xl font-black font-headline text-slate-900 leading-[0.95] uppercase">We Provide <br/>The Signal.</h2>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        Logistics Flow is a Data-as-a-Service ecosystem. We map 22,000+ industrial entities so you can find capacity, source parts at syndicate rates, and access in-house funding.
                    </p>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="bg-primary p-1 rounded-full mt-1 text-white"><CheckCircle2 className="h-5 w-5" /></div>
                            <p className="font-bold text-slate-700">Direct Access to 5,400+ Verified Hauliers</p>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="bg-primary p-1 rounded-full mt-1 text-white"><CheckCircle2 className="h-5 w-5" /></div>
                            <p className="font-bold text-slate-700">Syndicate Pricing on Tires, Spares & Fuel</p>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="bg-primary p-1 rounded-full mt-1 text-white"><CheckCircle2 className="h-5 w-5" /></div>
                            <p className="font-bold text-slate-700">25 Years of specialized industrial funding expertise</p>
                        </div>
                    </div>
                    <Button asChild size="lg" className="h-16 px-10 font-black uppercase tracking-widest shadow-xl text-white">
                        <Link href="/about">How it works <ArrowRight className="ml-2 h-5 w-5"/></Link>
                    </Button>
                </div>
            </div>
        </div>
      </section>

      {/* SIMPLIFIED PRICING PREVIEW */}
      <section className="py-24 bg-slate-900 text-white">
          <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
                    <h2 className="text-4xl md:text-6xl font-black font-headline text-white tracking-tight uppercase">Pick Your Path.</h2>
                    <p className="text-lg text-slate-400">No complex layers. Just two simple ways to engage with the grid.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    <Card className="bg-slate-800 border-white/10 p-10 flex flex-col h-full text-white">
                        <div className="bg-primary/20 p-4 rounded-2xl w-fit mb-6"><Search className="h-10 w-10 text-primary" /></div>
                        <h3 className="text-3xl font-black uppercase mb-2">The Map</h3>
                        <p className="text-slate-400 mb-8">Access the registry. See the direct MD/CEO contacts for 22,000+ businesses.</p>
                        <div className="mt-auto">
                            <p className="text-4xl font-black text-white mb-6">R100 <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">/ Month</span></p>
                            <Button asChild className="w-full h-14 font-black uppercase tracking-widest bg-white text-black hover:bg-slate-200 shadow-xl">
                                <Link href="/checkout/intelligence">Unlock the Map</Link>
                            </Button>
                        </div>
                    </Card>

                    <Card className="bg-primary border-none p-10 flex flex-col h-full text-white shadow-2xl ring-4 ring-primary/30 ring-offset-8 ring-offset-slate-900">
                        <div className="bg-white/20 p-4 rounded-2xl w-fit mb-6"><Zap className="h-10 w-10 text-white" /></div>
                        <h3 className="text-3xl font-black uppercase mb-2">The Engine</h3>
                        <p className="text-green-100 mb-8">Full transactional access. Post loads, create your shop, and apply for in-house finance.</p>
                        <div className="mt-auto">
                            <p className="text-4xl font-black text-white mb-6">R500 <span className="text-xs text-green-200 font-bold uppercase tracking-widest">/ Month</span></p>
                            <Button asChild className="w-full h-14 font-black uppercase tracking-widest bg-slate-900 text-white hover:bg-slate-800 shadow-xl">
                                <Link href="/checkout/standard">Activate the Engine</Link>
                            </Button>
                        </div>
                    </Card>
                </div>
          </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 bg-white">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-4xl md:text-7xl font-black font-headline text-slate-900 tracking-tighter text-center uppercase leading-none mb-8">Stop guessing.<br/>Start Flowing.</h2>
                <p className="text-xl max-w-xl mx-auto text-muted-foreground leading-relaxed mb-12">Join the community that is turning industrial relationships into a measurable digital asset.</p>
                <div className="flex justify-center">
                     <Button size="lg" className="h-16 px-16 text-lg font-black uppercase shadow-2xl text-white bg-primary hover:bg-primary/90" onClick={handleJoinClick}>
                        Join for Free <ArrowRight className="ml-2 h-6 w-6" />
                    </Button>
                </div>
            </div>
        </section>
    </div>
  );
}
