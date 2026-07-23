'use client';

import * as React from 'react';
import { Button as ShadButton } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowRight, SearchCode, CheckCircle2, ShieldCheck, Database, Truck, Landmark, Building2, Zap, MapPin, Users, Briefcase, UserCheck, Rocket, Sparkles, Scale, Handshake, Network, Fingerprint, FileCheck, Banknote } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import data from "@/lib/placeholder-images.json";
import { useUser } from "@/firebase";
import { useState } from "react";
import * as gtag from '@/lib/gtag';
import { HomeIntentModal } from "./home-intent-modal";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

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
  
  const ctaLink = user ? '/account' : '#';

  return (
    <div className="bg-background text-left text-foreground">
      <HomeIntentModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
      
      {/* HERO SECTION: THE DATA + TRANSACTION IDENTITY */}
      <section className="relative w-full h-[75vh] flex items-center justify-center overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 z-0 opacity-20">
           {heroImage && <Image src={heroImage.imageUrl} alt="Logistics Background" fill className="object-cover" priority data-ai-hint="truck highway night" />}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950" />

        <div className="container relative z-10 mx-auto px-4 text-center">
            <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 py-1.5 px-6 text-xs font-black uppercase tracking-[0.2em]">Data Foundation • Transactional Engine</Badge>
            <h1 className="text-5xl md:text-8xl font-black font-headline leading-tight mb-6 tracking-tighter text-center">Map the Grid.<br/>Execute the <span className="text-primary">Flow</span>.</h1>
            <p className="text-lg md:text-2xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed text-center">We are an industrial data company. We provide the forensic map of the transport grid, and the transactional engine to fund and move it.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <ShadButton size="lg" className="h-16 px-12 text-lg font-black uppercase tracking-tight shadow-xl" onClick={handleJoinClick}>
                    Establish Handshake <ArrowRight className="ml-2 h-5 w-5" />
                </ShadButton>
                <ShadButton asChild size="lg" variant="outline" className="h-16 px-12 text-lg font-black uppercase tracking-tight border-white/20 hover:bg-white/10">
                    <Link href="/pricing">View Intelligence Nodes</Link>
                </ShadButton>
            </div>
        </div>
      </section>

      {/* SECTION 1: THE DATA FOUNDATION (THE MAP) */}
      <section className="py-24 bg-slate-50 border-b">
        <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
                <Badge variant="outline" className="border-primary/30 text-primary font-black uppercase text-[10px] tracking-widest px-4">Layer 1: The Registry</Badge>
                <h2 className="text-3xl md:text-5xl font-black font-headline text-slate-900">22,000+ Forensic Industrial Records</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                    Our database is the source of truth for South African logistics. We map direct lines to the decision-makers that other platforms ignore.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="p-8 border-none shadow-xl bg-white hover:shadow-2xl transition-all group text-left">
                    <div className="bg-blue-100 p-3 rounded-2xl w-fit mb-6 group-hover:bg-blue-600 transition-colors text-left">
                        <Truck className="h-8 w-8 text-blue-600 group-hover:text-white" />
                    </div>
                    <h3 className="text-2xl font-black mb-2 text-left">Transporters</h3>
                    <p className="text-muted-foreground text-sm mb-6 leading-relaxed text-left">Map 5,420+ verified hauliers. Filter by RC1 compliance, GIT insurance, and specialized vehicle classes.</p>
                    <ShadButton variant="link" className="p-0 h-auto font-black uppercase text-[10px] tracking-widest text-primary" asChild>
                        <Link href="/intelligence/transporter">Search Registry <ArrowRight className="ml-1 h-3 w-3"/></Link>
                    </ShadButton>
                </Card>

                <Card className="p-8 border-none shadow-xl bg-white hover:shadow-2xl transition-all group text-left">
                    <div className="bg-green-100 p-3 rounded-2xl w-fit mb-6 group-hover:bg-green-600 transition-colors text-left">
                        <Building2 className="h-8 w-8 text-green-600 group-hover:text-white" />
                    </div>
                    <h3 className="text-2xl font-black mb-2 text-left">Suppliers</h3>
                    <p className="text-muted-foreground text-sm mb-6 leading-relaxed text-left">28 industrial categories mapped. Direct lines to CEO/MD level leadership for parts, fuel, and tires.</p>
                    <ShadButton variant="link" className="p-0 h-auto font-black uppercase text-[10px] tracking-widest text-primary" asChild>
                        <Link href="/intelligence/supplier">Search Registry <ArrowRight className="ml-1 h-3 w-3"/></Link>
                    </ShadButton>
                </Card>

                <Card className="p-8 border-none shadow-xl bg-white hover:shadow-2xl transition-all group text-left">
                    <div className="bg-amber-100 p-3 rounded-2xl w-fit mb-6 group-hover:bg-amber-600 transition-colors text-left">
                        <Landmark className="h-8 w-8 text-amber-600 group-hover:text-white" />
                    </div>
                    <h3 className="text-2xl font-black mb-2 text-left">Capital</h3>
                    <p className="text-muted-foreground text-sm mb-6 leading-relaxed text-left">Connect with 85+ specialized lenders. Match your operational data with targeted working capital.</p>
                    <ShadButton variant="link" className="p-0 h-auto font-black uppercase text-[10px] tracking-widest text-primary" asChild>
                        <Link href="/intelligence/finance">Search Registry <ArrowRight className="ml-1 h-3 w-3"/></Link>
                    </ShadButton>
                </Card>
            </div>
        </div>
      </section>

      {/* SECTION 2: THE DIFFERENTIATOR (THE TRANSACTION ENGINE) */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
                <div className="relative">
                    <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full opacity-30 animate-pulse" />
                    <Card className="relative z-10 border-none shadow-2xl bg-slate-900 text-white p-10 rounded-[2.5rem] text-left">
                        <div className="space-y-8 text-left">
                            <div className="flex items-center gap-3 text-left">
                                <Scale className="h-8 w-8 text-primary" />
                                <h4 className="font-black uppercase tracking-[0.2em] text-sm text-left">Transactional Layer</h4>
                            </div>
                            <div className="space-y-4 text-left">
                                <div className="flex items-start gap-4 text-left">
                                    <div className="bg-primary/20 p-2 rounded-lg mt-1"><Handshake className="h-5 w-5 text-primary" /></div>
                                    <div className="text-left"><p className="font-bold text-white text-left">The Handshake Protocol</p><p className="text-xs text-slate-400 text-left">Data-verified matching between transporters and suppliers.</p></div>
                                </div>
                                <div className="flex items-start gap-4 text-left">
                                    <div className="bg-primary/20 p-2 rounded-lg mt-1"><FileCheck className="h-5 w-5 text-primary" /></div>
                                    <div className="text-left"><p className="font-bold text-white text-left">Fulfillment Ledger</p><p className="text-xs text-slate-400 text-left">Automated Proof of Delivery (POD) and invoicing synchronization.</p></div>
                                </div>
                                <div className="flex items-start gap-4 text-left">
                                    <div className="bg-primary/20 p-2 rounded-lg mt-1"><Banknote className="h-5 w-5 text-primary" /></div>
                                    <div className="text-left"><p className="font-bold text-white text-left">Capital Injection</p><p className="text-xs text-slate-400 text-left">Real-world activity data allows us to fund your deals instantly.</p></div>
                                </div>
                            </div>
                            <Separator className="bg-white/10" />
                            <div className="p-6 bg-primary/10 rounded-3xl border border-primary/20 text-center">
                                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1 text-center">Total Transactional Flow</p>
                                <p className="text-3xl font-black text-white text-center">Live Monitoring</p>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="space-y-8 text-left text-foreground">
                    <Badge className="bg-primary/10 text-primary border-primary/20 font-bold uppercase tracking-widest px-4 py-1">Layer 2: The Engine</Badge>
                    <h2 className="text-4xl md:text-6xl font-black font-headline text-slate-900 leading-tight text-left">Data is the Map.<br/>Transactions are the Vehicle.</h2>
                    <p className="text-xl text-muted-foreground leading-relaxed text-left">
                        A directory is useless if you can't close the deal. Logistics Flow differentiates itself by building <strong>Transactional Hubs</strong> on top of our datasets. 
                    </p>
                    <p className="text-lg font-bold text-slate-800 text-left">
                        We facilitate the handshake, verify the compliance, and provide the capital to execute the work.
                    </p>
                    
                    <div className="pt-4 flex flex-col sm:flex-row gap-4 text-left">
                        <ShadButton asChild size="lg" className="h-14 px-10 font-black uppercase shadow-xl" onClick={handleJoinClick}>
                            <Link href={ctaLink}>Activate Transaction Node <ArrowRight className="ml-2 h-4 w-4"/></Link>
                        </ShadButton>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* SECTION 3: THE ACTIVATION INCENTIVE */}
      <section className="py-24 bg-slate-900 text-white border-b">
        <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-6 text-left">
                    <Badge className="bg-primary text-white border-none font-black text-[10px] uppercase tracking-widest px-4">Immediate ROI</Badge>
                    <h2 className="text-4xl md:text-5xl font-black font-headline leading-tight text-white">The Activation Bundle</h2>
                    <p className="text-xl text-slate-400 leading-relaxed text-left text-white">
                        Establish your Intelligence Access for **R100/mo** and instantly receive a **R500 Community Welcome Gift** to lower your operating costs from day one.
                    </p>
                    <ul className="space-y-4 pt-4 text-left">
                        <li className="flex items-center gap-3 text-lg font-bold text-slate-200 text-left"><CheckCircle2 className="h-6 w-6 text-primary" /> Verified Tier 1 Supplier Voucher</li>
                        <li className="flex items-center gap-3 text-lg font-bold text-slate-200 text-left"><CheckCircle2 className="h-6 w-6 text-primary" /> Full Registry MD/CEO Contact Access</li>
                        <li className="flex items-center gap-3 text-lg font-bold text-slate-200 text-left"><CheckCircle2 className="h-6 w-6 text-primary" /> Direct introduced path to specialized finance</li>
                    </ul>
                </div>
                <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] text-center backdrop-blur-sm">
                    <Zap className="h-16 w-16 text-primary mx-auto mb-6 fill-primary" />
                    <h3 className="text-3xl font-black mb-4 text-white">R100 Membership</h3>
                    <p className="text-6xl font-black text-white mb-6">R500 <span className="text-xl font-normal text-slate-500">Value</span></p>
                    <ShadButton asChild size="lg" className="w-full h-16 text-lg font-black uppercase shadow-2xl" onClick={handleJoinClick}>
                        <Link href={ctaLink}>Claim Activation Bundle <ArrowRight className="ml-2 h-5 w-5"/></Link>
                    </ShadButton>
                </div>
            </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 bg-background">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-4xl md:text-7xl font-black font-headline text-slate-900 tracking-tighter">Ready to plug into the grid?</h2>
                <p className="mt-8 text-xl max-w-2xl mx-auto text-muted-foreground leading-relaxed text-center">Join thousands of industry professionals who have moved from fragmented manual processes to a high-velocity digital ecosystem.</p>
                <div className="mt-12 flex justify-center gap-6">
                     <ShadButton asChild size="lg" className="h-16 px-16 text-lg font-black uppercase shadow-2xl" onClick={handleJoinClick}>
                        <Link href={ctaLink}>Join for Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
                    </ShadButton>
                </div>
            </div>
        </section>
    </div>
  );
}
