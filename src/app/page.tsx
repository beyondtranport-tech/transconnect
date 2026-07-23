
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, SearchCode, CheckCircle2, ShieldCheck, Database, Truck, Landmark, Building2, Zap, MapPin, Users, Briefcase, UserPlus, Gift, Rocket, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import data from "@/lib/placeholder-images.json";
import { useUser } from "@/firebase";
import { useState, useMemo } from "react";
import * as gtag from '@/lib/gtag';
import { HomeIntentModal } from "./home-intent-modal";
import { useConfig } from "@/hooks/use-config";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const { placeholderImages } = data;
const heroImage = placeholderImages.find(p => p.id === 'hero-home');

const transporterCategories = ["Long Haul", "Refrigerated", "Flatbed", "Tipper", "Hazmat", "LTL", "Cross-Border"];
const supplierCategories = ["Brakes", "Tyres", "Oils", "Differential", "Engine Parts", "Turbo", "Auto Electrical"];

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
  
  const ctaLink = user ? '/account' : '#';

  return (
    <div className="bg-background text-left">
      <HomeIntentModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
      
      {/* HERO SECTION */}
      <section className="relative w-full h-[70vh] md:h-[80vh] flex items-center justify-center overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 z-0 opacity-20">
           {heroImage && <Image src={heroImage.imageUrl} alt="Logistics Background" fill className="object-cover" priority data-ai-hint="truck highway night" />}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950" />

        <div className="container relative z-10 mx-auto px-4 text-center">
            <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 py-1.5 px-6 text-xs font-black uppercase tracking-[0.2em]">The Transport Community Hub</Badge>
            <h1 className="text-5xl md:text-8xl font-black font-headline leading-tight mb-6 tracking-tighter">Connecting People,<br/>Creating <span className="text-primary">Flow</span></h1>
            <p className="text-lg md:text-2xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed text-center">Logistics Flow is a unified digital ecosystem built to break industry constraints through shared intelligence and collective power.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button asChild size="lg" className="h-16 px-12 text-lg font-black uppercase tracking-tight shadow-xl" onClick={handleJoinClick}>
                    <Link href={ctaLink}>Establish Handshake <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-16 px-12 text-lg font-black uppercase tracking-tight border-white/20 hover:bg-white/10">
                    <Link href="/pricing">View Intelligence Nodes</Link>
                </Button>
            </div>
        </div>
      </section>

      {/* ACTIVATION BUNDLE HOOK */}
      <section className="py-24 bg-white border-b relative overflow-hidden">
        <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-6 text-left">
                    <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[10px] uppercase tracking-widest px-4">Instant ROI</Badge>
                    <h2 className="text-4xl md:text-6xl font-black font-headline text-slate-900 leading-tight">The Activation Bundle</h2>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        Establish your Intelligence Access for **R100/mo** and instantly receive a **R500 Community Welcome Gift** from our verified Supplier Partners. 
                    </p>
                    <p className="text-lg font-bold text-slate-800">Intelligence isn't a cost—it's a profit center.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 text-left">
                        <div className="flex items-start gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg mt-1"><Gift className="h-5 w-5 text-primary" /></div>
                            <div><p className="font-bold text-sm">Voucher Vault</p><p className="text-xs text-muted-foreground">Access immediate discounts on tires, parts, and fuel.</p></div>
                        </div>
                        <div className="flex items-start gap-3 text-left">
                            <div className="bg-primary/10 p-2 rounded-lg mt-1"><Sparkles className="h-5 w-5 text-primary" /></div>
                            <div><p className="font-bold text-sm">Forensic Access</p><p className="text-xs text-muted-foreground">Unlock 22,000+ verified MD/CEO contacts in the registry.</p></div>
                        </div>
                    </div>
                    <Button asChild size="lg" className="mt-8 h-14 px-10 font-black uppercase shadow-xl" onClick={handleJoinClick}>
                        <Link href={ctaLink}>Claim Your Welcome Gift <ArrowRight className="ml-2 h-4 w-4"/></Link>
                    </Button>
                </div>
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full opacity-30 animate-pulse" />
                    <Card className="relative z-10 border-none shadow-2xl bg-slate-900 text-white p-10 rounded-[2.5rem] overflow-hidden">
                        <div className="space-y-6 text-left text-white">
                             <div className="flex items-center gap-3">
                                <Zap className="h-8 w-8 text-primary fill-primary" />
                                <h4 className="font-black uppercase tracking-widest text-sm">Activation Yield</h4>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Estimated Activation Value</p>
                                <p className="text-6xl font-black text-white">R500+</p>
                            </div>
                            <Separator className="bg-white/10" />
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-sm font-bold text-slate-300"><CheckCircle2 className="h-5 w-5 text-primary" /> Tier 1 Supplier Voucher</div>
                                <div className="flex items-center gap-3 text-sm font-bold text-slate-300"><CheckCircle2 className="h-5 w-5 text-primary" /> Free Registry Snapshot</div>
                                <div className="flex items-center gap-3 text-sm font-bold text-slate-300"><CheckCircle2 className="h-5 w-5 text-primary" /> Direct Funder Introduction</div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
      </section>

      {/* CORE REGISTRIES PREVIEW */}
      <section className="py-24 bg-slate-50 border-b">
        <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-5xl font-black font-headline mb-12">The Map to the Grid</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Card className="p-8 border-none shadow-xl bg-white hover:shadow-2xl transition-all group text-left">
                    <Truck className="h-10 w-10 text-blue-600 mb-6 group-hover:scale-110 transition-transform" />
                    <h3 className="text-2xl font-black mb-2">Transporter Registry</h3>
                    <p className="text-muted-foreground text-sm mb-6 leading-relaxed">Map over 5,420+ verified South African hauliers. Filter by RC1 compliance, vehicle class, and region.</p>
                    <Button variant="link" className="p-0 h-auto font-black uppercase text-[10px] tracking-widest" asChild><Link href="/intelligence/transporter">Enter Registry <ArrowRight className="ml-1 h-3 w-3"/></Link></Button>
                </Card>
                <Card className="p-8 border-none shadow-xl bg-white hover:shadow-2xl transition-all group text-left">
                    <Building2 className="h-10 w-10 text-primary mb-6 group-hover:scale-110 transition-transform" />
                    <h3 className="text-2xl font-black mb-2">Supplier Registry</h3>
                    <p className="text-muted-foreground text-sm mb-6 leading-relaxed">22,000+ verified records across 28 industrial categories. Direct lines to CEO/MD leadership.</p>
                    <Button variant="link" className="p-0 h-auto font-black uppercase text-[10px] tracking-widest" asChild><Link href="/intelligence/supplier">Enter Registry <ArrowRight className="ml-1 h-3 w-3"/></Link></Button>
                </Card>
                <Card className="p-8 border-none shadow-xl bg-white hover:shadow-2xl transition-all group text-left">
                    <Landmark className="h-10 w-10 text-amber-600 mb-6 group-hover:scale-110 transition-transform" />
                    <h3 className="text-2xl font-black mb-2">Capital Registry</h3>
                    <p className="text-muted-foreground text-sm mb-6 leading-relaxed">Connect with 85+ specialized lenders. Match your operational performance with target capital.</p>
                    <Button variant="link" className="p-0 h-auto font-black uppercase text-[10px] tracking-widest" asChild><Link href="/intelligence/finance">Enter Registry <ArrowRight className="ml-1 h-3 w-3"/></Link></Button>
                </Card>
            </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 bg-background">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-4xl md:text-6xl font-black font-headline">Ready to claim your node?</h2>
                <p className="mt-6 text-xl max-w-2xl mx-auto text-muted-foreground leading-relaxed text-center">Join thousands of transport professionals who have bypassed fragmented systems for a unified digital ecosystem.</p>
                <div className="mt-12 flex justify-center gap-6">
                     <Button asChild size="lg" className="h-16 px-16 text-lg font-black uppercase shadow-2xl" onClick={handleJoinClick}>
                        <Link href={ctaLink}>Join for Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
                    </Button>
                </div>
            </div>
        </section>
    </div>
  );
}
